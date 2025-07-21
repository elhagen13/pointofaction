import { buffer } from 'micro';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      
      // Here you would typically:
      // 1. Update your database with the successful payment
      // 2. Send confirmation email to customer
      // 3. Update inventory
      // 4. Trigger fulfillment process
      
      console.log('Product ID:', paymentIntent.metadata.productId);
      console.log('Product Name:', paymentIntent.metadata.productName);
      console.log('Amount:', paymentIntent.amount / 100);
      
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      
      // Handle failed payment
      // You might want to:
      // 1. Log the failure
      // 2. Send notification to customer
      // 3. Update analytics
      
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
}