const crypto = require('crypto');

// Datos de prueba
const webhookSecret = 'whsec_AFUlVEWko9cqU3wqCbFDRiIRfjofQ8pm'; // Tu webhook secret
const timestamp = Math.floor(Date.now() / 1000);
const payload = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2025-07-30.basil',
  created: timestamp,
  data: {
    object: {
      id: 'pi_test_webhook',
      object: 'payment_intent',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        orderId: 'test-order-123'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_webhook',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
});

// Generar firma
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signedPayload, 'utf8')
  .digest('hex');

const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('=== Webhook Test Data ===');
console.log('Timestamp:', timestamp);
console.log('Payload:', payload);
console.log('Stripe Signature:', stripeSignature);
console.log('\n=== cURL Command ===');
console.log(`curl -X POST http://localhost:3001/payments/webhook \\
  -H "Content-Type: application/json" \\
  -H "stripe-signature: ${stripeSignature}" \\
  -d '${payload}'`);

console.log('\n=== Test with Node.js ===');
console.log(`
const axios = require('axios');

const response = await axios.post('http://localhost:3001/payments/webhook', 
  ${JSON.stringify(payload)}, 
  {
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': '${stripeSignature}'
    }
  }
);

console.log('Response:', response.data);
`);
