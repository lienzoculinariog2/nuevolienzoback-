const crypto = require('crypto');

// Configuración
const WEBHOOK_SECRET = 'whsec_5a2625c0d3af7418734a74c0b6245707846ebf18e674ce2eaf996ac34d958ec4';

// Payload de Insomnia
const payload = {
  "id": "evt_test_insomnia",
  "object": "event",
  "api_version": "2025-07-30",
  "created": 1756152857,
  "data": {
    "object": {
      "id": "pi_test_payment_intent_insomnia",
      "object": "payment_intent",
      "amount": 1500,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "orderId": "test-order-123"
      }
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_request_insomnia",
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
};

// Función para crear firma de Stripe
function createStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

// Generar firma
const signature = createStripeSignature(payload, WEBHOOK_SECRET);
const payloadString = JSON.stringify(payload);

console.log('🔧 CONFIGURACIÓN PARA INSOMNIA');
console.log('=============================');
console.log('');
console.log('📋 URL:');
console.log('http://localhost:3001/payments/webhook');
console.log('');
console.log('📋 Headers:');
console.log('Content-Type: application/json');
console.log(`stripe-signature: ${signature}`);
console.log('');
console.log('📋 Body (JSON):');
console.log(payloadString);
console.log('');
console.log('📊 Información adicional:');
console.log('Payload length:', payloadString.length);
console.log('Timestamp:', Math.floor(Date.now() / 1000));
console.log('');
console.log('✅ Copia y pega estos valores en Insomnia');
