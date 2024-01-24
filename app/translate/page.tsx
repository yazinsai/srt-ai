import ClientPage from './page.client';

import { kv } from '@vercel/kv';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

interface URLSearchParams {
  id: string;
  canceled?: boolean;
  success?: boolean;
}

export default async function Page({ searchParams }: { searchParams: URLSearchParams }) {
  // Retrieve the Stripe session
  const value = await kv.get<any>(searchParams.id)
  if (!value) {
    return (
      <div>
        Session not found
      </div>
    )
  }
  const { sessionId, content, language } = value;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // Check if the session has been canceled
  if (session.payment_status !== 'paid') {
    return (
      <div>
        Payment failed
      </div>
    )
  }

  return (
    <div>
      <ClientPage content={content} language={language} />
    </div>
  )
}