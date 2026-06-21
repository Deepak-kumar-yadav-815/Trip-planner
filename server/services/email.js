import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.resend.com',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'resend',
    pass: process.env.SMTP_PASS
  }
});

export const sendExpenseSummaryEmail = async (toEmail, tripName, balances) => {
  if (!process.env.SMTP_PASS) {
    console.log('Skipping email send: SMTP_PASS not configured');
    return;
  }

  // Generate HTML table for balances
  const balancesHtml = balances.map(b => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${b.from}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">owes</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${b.to}</td>
      <td style="padding: 8px; border: 1px solid #ddd;"><b>₹${b.amount.toFixed(2)}</b></td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #4F46E5;">Expense Summary for ${tripName}</h2>
      <p>The trip expenses have been finalized! Here is the simplified breakdown of who owes whom:</p>
      
      ${balances.length > 0 ? `
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-top: 20px;">
          ${balancesHtml}
        </table>
      ` : '<p><i>All expenses are perfectly settled! No one owes anything.</i></p>'}
      
      <p style="margin-top: 30px;">Log in to Trip Planner to view all detailed expense receipts.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"Trip Planner" <onboarding@resend.dev>', // Resend trial requires this from address unless verified domain
      to: toEmail,
      subject: `Final Expense Summary: ${tripName}`,
      html: html,
    });
    console.log(`Email sent to ${toEmail}: ${info.messageId}`);
  } catch (error) {
    console.error(`Failed to send email to ${toEmail}:`, error);
  }
};
