import { NextRequest, NextResponse } from "next/server";

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { headers } from 'next/headers'
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  const headersList = headers();
  const origin = headersList.get('origin')

  // TODO: Calculate seconds, instead of reading it (vulnerable to manipulation)
  const formData = await request.formData();
  const seconds = Number(formData.get('seconds'));
  const content = formData.get('content');
  const language = formData.get('language');
  const quantity = Math.ceil(seconds / 3600); // $1/hr, min $1

  // Generate a 16 character random alphanumeric ID for the KV key
  const kvId = Math.random().toString(36).slice(2, 18);

  try {
    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SRT translation (1 hour)'
            },
            unit_amount: 100, // $1/hour
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/translate?success=true&id=${kvId}`,
      cancel_url: `${origin}/?canceled=true`,
    });

    // Save sessionId to KV
    await kv.set(kvId, JSON.stringify({ sessionId: session.id, content, language }));

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    return NextResponse.error();
  }
}