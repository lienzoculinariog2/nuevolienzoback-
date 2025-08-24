const crypto = require('crypto');

// Tu webhook secret (de .env.development)
const webhookSecret = 'whsec_AFUlVEWko9cqU3wqCbFDRiIRfjofQ8pm';

// Payload de ejemplo (evento de pago exitoso)
const payload = JSON.stringify({
  id: 'evt_test_123',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_123',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded'
    }
  }
});

// Generar timestamp
const timestamp = Math.floor(Date.now() / 1000);

// Crear firma
const signedPayload = `${timestamp}.${payload}`;
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signedPayload, 'utf8')
  .digest('hex');

// Formato final
const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('=== Stripe Signature ===');
console.log(stripeSignature);
console.log('\n=== Para usar en cURL ===');
console.log(`curl -X POST http://localhost:3001/payments/webhook \\
  -H "Content-Type: application/json" \\
  -H "stripe-signature: ${stripeSignature}" \\
  -d '${payload}'`);
