// app/api/create-payment-intent/route.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const { amount, currency = 'usd', productIds, metadata } = await req.json();

    // Validate required fields
    if (!amount || !productIds) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: amount and productIds',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return new Response(
        JSON.stringify({
          error: 'Amount must be greater than 0',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        productIds: Array.isArray(productIds) ? productIds.join(',') : productIds.toString(),
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to create payment intent',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}