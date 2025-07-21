// pages/api/create-payment-intent.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    try {
        const { amount, currency = 'usd', productId, productName } = await req.json();
    
        // Validate required fields
        if (!amount || !productId || !productName) {
          return new Response(JSON.stringify({ 
            error: 'Missing required fields: amount, productId, productName' 
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
    
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency,
          metadata: {
            productId: productId.toString(),
            productName: productName,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });
    
        return new Response(JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Error creating payment intent:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to create payment intent',
          details: error.message 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
}