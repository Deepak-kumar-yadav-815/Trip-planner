import express from 'express';
import { requireAuth, syncUser } from '../middleware/auth.js';
import Expense from '../models/Expense.js';
import Trip from '../models/Trip.js';
import { sendExpenseSummaryEmail } from '../services/email.js';

const router = express.Router({ mergeParams: true });

// Helper to check membership
const verifyMember = async (tripId, userId) => {
  const trip = await Trip.findById(tripId).populate('members.user');
  if (!trip) return null;
  const isMember = trip.members.some(m => m.user._id.toString() === userId.toString() || m.user.clerkId === userId.toString());
  return isMember ? trip : null;
};

// GET all expenses
router.get('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await verifyMember(tripId, req.dbUser._id);
    if (!trip) return res.status(403).json({ error: 'Forbidden' });

    const expenses = await Expense.find({ tripId })
      .populate('paidBy', 'name avatar email')
      .populate('splits.user', 'name avatar email')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST new expense
router.post('/', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { title, amount, paidBy, splits } = req.body;

    const trip = await verifyMember(tripId, req.dbUser._id);
    if (!trip) return res.status(403).json({ error: 'Forbidden' });

    // Validate splits add up to total amount (allow slight rounding difference)
    const totalSplit = splits.reduce((sum, s) => sum + Number(s.amountOwed), 0);
    if (Math.abs(totalSplit - Number(amount)) > 0.1) {
      return res.status(400).json({ error: 'Splits must add up to the total amount.' });
    }

    const expense = await Expense.create({
      tripId,
      paidBy,
      title,
      amount: Number(amount),
      splits: splits.map(s => ({ user: s.user, amountOwed: Number(s.amountOwed) }))
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// DELETE expense
router.delete('/:expenseId', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId, expenseId } = req.params;
    const trip = await verifyMember(tripId, req.dbUser._id);
    if (!trip) return res.status(403).json({ error: 'Forbidden' });

    await Expense.findByIdAndDelete(expenseId);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// POST Finalize (Simplify Debts)
router.post('/settle', requireAuth, syncUser, async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await verifyMember(tripId, req.dbUser._id);
    if (!trip) return res.status(403).json({ error: 'Forbidden' });

    const expenses = await Expense.find({ tripId }).populate('paidBy', 'name email').populate('splits.user', 'name email');
    
    // 1. Calculate net balances for every user
    const balances = {}; // { userId: { userObj, netAmount: 0 } }
    
    // Initialize map with all trip members to handle edge cases
    trip.members.forEach(m => {
      balances[m.user._id.toString()] = { user: m.user, netAmount: 0 };
    });

    expenses.forEach(exp => {
      const payerId = exp.paidBy._id.toString();
      if (!balances[payerId]) balances[payerId] = { user: exp.paidBy, netAmount: 0 };
      
      // Payer gets credited (+)
      balances[payerId].netAmount += exp.amount;

      // Splitees get debited (-)
      exp.splits.forEach(s => {
        const debtorId = s.user._id.toString();
        if (!balances[debtorId]) balances[debtorId] = { user: s.user, netAmount: 0 };
        balances[debtorId].netAmount -= s.amountOwed;
      });
    });

    // 2. Separate into Debtors (-) and Creditors (+)
    const debtors = [];
    const creditors = [];

    Object.values(balances).forEach(b => {
      if (b.netAmount < -0.01) debtors.push({ ...b, netAmount: Math.abs(b.netAmount) });
      else if (b.netAmount > 0.01) creditors.push(b);
    });

    // Sort descending by amount to settle largest debts first
    debtors.sort((a, b) => b.netAmount - a.netAmount);
    creditors.sort((a, b) => b.netAmount - a.netAmount);

    // 3. Greedily settle debts
    const settlements = [];
    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const settleAmount = Math.min(debtor.netAmount, creditor.netAmount);
      
      settlements.push({
        fromId: debtor.user._id,
        from: debtor.user.name,
        toId: creditor.user._id,
        to: creditor.user.name,
        amount: settleAmount
      });

      debtor.netAmount -= settleAmount;
      creditor.netAmount -= settleAmount;

      if (debtor.netAmount < 0.01) i++;
      if (creditor.netAmount < 0.01) j++;
    }

    // 4. Send email summary to ALL members
    for (const m of trip.members) {
      if (m.user.email) {
        await sendExpenseSummaryEmail(m.user.email, trip.title, settlements);
      }
    }

    res.json({ settlements, balances: Object.values(balances) });
  } catch (error) {
    console.error('Error settling expenses:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

export default router;
