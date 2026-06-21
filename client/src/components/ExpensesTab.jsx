import { useState, useEffect } from 'react';
import { useAuth, useUser } from "@clerk/clerk-react";

export default function ExpensesTab({ tripId, members, tripName }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' or 'custom'
  const [customSplits, setCustomSplits] = useState({}); // { userId: amount }
  const [selectedMembers, setSelectedMembers] = useState([]); // For equal split selection

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (members.length > 0) {
      const dbUserId = members.find(m => m.user.clerkId === user.id)?.user._id;
      setPaidBy(dbUserId || members[0].user._id);
      setSelectedMembers(members.map(m => m.user._id));
    }
    fetchExpenses();
  }, [tripId, members]);

  const fetchExpenses = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/expenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setExpenses(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount || Number(amount) <= 0) return;

    let splits = [];
    if (splitMode === 'equal') {
      if (selectedMembers.length === 0) return alert('Select at least one member to split with.');
      const splitAmount = (Number(amount) / selectedMembers.length).toFixed(2);
      splits = selectedMembers.map(uid => ({ user: uid, amountOwed: splitAmount }));
    } else {
      let totalCustom = 0;
      for (const [uid, amt] of Object.entries(customSplits)) {
        if (amt && Number(amt) > 0) {
          splits.push({ user: uid, amountOwed: Number(amt) });
          totalCustom += Number(amt);
        }
      }
      if (Math.abs(totalCustom - Number(amount)) > 0.1) {
        return alert(`Custom splits total (₹${totalCustom}) does not match expense amount (₹${amount}).`);
      }
    }

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount: Number(amount), paidBy, splits })
      });
      if (res.ok) {
        setTitle(''); setAmount(''); setSplitMode('equal'); setCustomSplits({});
        fetchExpenses();
        setSettlements([]); // Reset settlements as a new expense was added
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add expense');
      }
    } catch (err) { console.error(err); }
  };

  const handleFinalize = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/expenses/settle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettlements(data.settlements);
        setBalances(data.balances);
        alert('Debts Simplified and Email Sent to all members!');
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (expId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/trips/${tripId}/expenses/${expId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setExpenses(expenses.filter(e => e._id !== expId));
        setSettlements([]);
      }
    } catch (err) { console.error(err); }
  };

  const toggleMemberSelection = (uid) => {
    if (selectedMembers.includes(uid)) {
      setSelectedMembers(selectedMembers.filter(id => id !== uid));
    } else {
      setSelectedMembers([...selectedMembers, uid]);
    }
  };

  const handleCustomSplitChange = (uid, val) => {
    setCustomSplits({ ...customSplits, [uid]: val });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Expense Form */}
      <div className="lg:col-span-1 bg-card border rounded-xl p-6 h-fit shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Add Expense</h3>
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Dinner at XYZ" className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Total Amount (₹)</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="1000" className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm" />
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground">Paid By</label>
            <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg bg-background text-sm">
              {members.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t mt-4">
            <div className="flex space-x-2 mb-3">
              <button type="button" onClick={() => setSplitMode('equal')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${splitMode === 'equal' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Split Equally</button>
              <button type="button" onClick={() => setSplitMode('custom')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${splitMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Custom Split</button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members.map(m => (
                <div key={m.user._id} className="flex items-center justify-between p-2 rounded-lg border bg-background/50">
                  <div className="flex items-center space-x-2">
                    {splitMode === 'equal' && (
                      <input type="checkbox" checked={selectedMembers.includes(m.user._id)} onChange={() => toggleMemberSelection(m.user._id)} className="rounded" />
                    )}
                    <span className="text-sm">{m.user.name}</span>
                  </div>
                  {splitMode === 'custom' && (
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">₹</span>
                      <input type="number" step="0.01" value={customSplits[m.user._id] || ''} onChange={e => handleCustomSplitChange(m.user._id, e.target.value)} placeholder="0.00" className="w-20 px-2 py-1 text-xs border rounded-md" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow hover:bg-primary/90 mt-4">Save Expense</button>
        </form>
      </div>

      {/* Expenses List & Balances */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Settlement Finalize Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-primary">Simplify Debts</h3>
              <p className="text-xs text-muted-foreground">Calculate the final net amounts who owes whom and send an email summary.</p>
            </div>
            <button onClick={handleFinalize} className="px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold shadow hover:bg-primary/90 transition-all">Finalize & Settle</button>
          </div>

          {settlements.length > 0 && (
            <div className="mt-4 p-4 bg-background border rounded-lg space-y-3">
              <h4 className="text-sm font-semibold mb-2">Final Settlements</h4>
              {settlements.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-md border">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-red-600">{s.from}</span>
                    <span className="text-muted-foreground text-xs">owes</span>
                    <span className="font-medium text-green-600">{s.to}</span>
                  </div>
                  <span className="font-bold text-lg">₹{s.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {settlements.length === 0 && balances.length > 0 && balances.every(b => Math.abs(b.netAmount) < 0.1) && (
            <p className="text-sm text-green-600 font-medium mt-2">All settled up! No outstanding debts.</p>
          )}
        </div>

        {/* Expenses List */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Recent Expenses</h3>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses added yet.</p>
          ) : (
            <div className="space-y-3">
              {expenses.map(exp => (
                <div key={exp._id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div>
                    <h4 className="font-medium text-sm">{exp.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">Paid by <span className="font-medium">{exp.paidBy?.name}</span> • {new Date(exp.date).toLocaleDateString()}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {exp.splits.map(s => (
                        <span key={s._id} className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                          {s.user?.name}: ₹{s.amountOwed.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end space-y-2">
                    <span className="font-bold text-lg">₹{exp.amount.toFixed(2)}</span>
                    <button onClick={() => handleDelete(exp._id)} className="text-xs text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-2 py-1 rounded">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
