const crypto = require('crypto');
require('dotenv').config({ path: '.env.development' });

console.log('🧪 PRUEBA DE WEBHOOK - Configuración Corregida');
console.log('==============================================\n');

// Verificar variables de entorno
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  console.log('❌ STRIPE_WEBHOOK_SECRET no encontrado');
  process.exit(1);
}

console.log('✅ Webhook secret configurado');

// Crear payload de prueba
const testPayload = {
  id: 'evt_test_webhook_fix',
  object: 'event',
  api_version: '2025-07-30.basil',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_webhook_fix',
      object: 'payment_intent',
      amount: 1000,
      currency: 'usd',
      status: 'succeeded',
      metadata: {
        orderId: 'test-order-webhook-fix'
      }
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_webhook_fix',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
};

const payloadString = JSON.stringify(testPayload);
const timestamp = Math.floor(Date.now() / 1000);

// Generar firma
const signedPayload = `${timestamp}.${payloadString}`;
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signedPayload, 'utf8')
  .digest('hex');

const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('📋 Información de la prueba:');
console.log('URL:', 'http://localhost:3001/payments/webhook');
console.log('Event Type:', testPayload.type);
console.log('Payment Intent ID:', testPayload.data.object.id);
console.log('Timestamp:', timestamp);
console.log('Signature:', stripeSignature.substring(0, 50) + '...');

console.log('\n🚀 Comando para probar:');
console.log('(Asegúrate de que el servidor esté corriendo con: npm run start:dev)');
console.log('');
console.log(`curl -X POST http://localhost:3001/payments/webhook \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "stripe-signature: ${stripeSignature}" \\`);
console.log(`  -d '${payloadString}'`);

console.log('\n📝 Para probar con Node.js:');
console.log(`
const axios = require('axios');

const response = await axios.post('http://localhost:3001/payments/webhook', 
  '${payloadString.replace(/'/g, "\\'")}',
  {
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': '${stripeSignature}'
    }
  }
);

console.log('Response:', response.data);
`);

console.log('\n🔍 Verificar en logs del servidor:');
console.log('1. "🔍 Webhook received:"');
console.log('2. "✅ Webhook verified successfully: payment_intent.succeeded"');
console.log('3. "✅ Webhook processed successfully"');

console.log('\n⚠️  Si ves "No raw body available":');
console.log('1. Verificar que el servidor esté corriendo');
console.log('2. Verificar que body-parser esté configurado correctamente');
console.log('3. Verificar que la ruta /payments/webhook esté disponible');
