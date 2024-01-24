import React from 'react';

export default function ({ seconds, children }: { seconds: number, children: React.ReactNode }) {
  const amount = Math.max(1, Math.floor(seconds / 600)) * 100; // $1 per 10 minutes, minimum of $1
  const amountInUsd = amount / 100;
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountInUsd);

  return (
    <form action={'/api/pay'} method='POST'>
      <input type="hidden" name="seconds" value={seconds} />
      {children}

      <h2>Ready to translate</h2>
      <p>Before you can perform the translation, please complete the payment below:</p>
      <button type="submit">Pay {formattedAmount}</button>
      <p>Our pricing is $1 for every 10 minutes. Your total is {formattedAmount}</p>
    </form>
  )
}