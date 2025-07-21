// pages/api/update-payment-intent.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { paymentIntentId, amount, quantity, productId, productName } = await req.json();
    
    // Validate required fields
    if (!paymentIntentId || !amount) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: paymentIntentId, amount'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }


    // Update payment intent with new amount
    const paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
      amount: Math.round(amount),
      metadata: {
        ...(productId && { productId: productId.toString() }),
        ...(productName && { productName: productName }),
        ...(quantity && { quantity: quantity.toString() }),
      }
    });

    return new Response(JSON.stringify({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error updating payment intent:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return new Response(JSON.stringify({
        error: 'Invalid payment intent or payment intent cannot be updated',
        details: error.message
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      error: 'Failed to update payment intent',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}