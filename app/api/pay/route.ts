import { NextRequest, NextResponse } from "next/server";

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const headersList = headers();
  const origin = headersList.get('origin')

  const formData = await request.formData();
  const seconds = Number(formData.get('seconds'));
  const quantity = Math.max(1, Math.floor(seconds / 600));

  try {
    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'SRT translation (up to 10 mins)'
            },
            unit_amount: 100, // $1 per 10 mins
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?success=true`,
      cancel_url: `${origin}/?canceled=true`,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    return NextResponse.error();
  }
}