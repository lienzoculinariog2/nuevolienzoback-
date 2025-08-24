const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

console.log('🧪 PRUEBA DE WEBHOOK CON SERVIDOR');
console.log('==================================\n');

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3001/api');
    console.log('✅ Servidor está corriendo en puerto 3001');
    return true;
  } catch (error) {
    console.log('❌ Servidor no está corriendo en puerto 3001');
    console.log('   Ejecuta: npm run start:dev');
    return false;
  }
}

// Probar webhook
async function testWebhook() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.log('❌ STRIPE_WEBHOOK_SECRET no configurado');
    return;
  }

  // Payload de prueba
  const testPayload = {
    id: 'evt_test_webhook_server',
    object: 'event',
    api_version: '2025-07-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'pi_test_webhook_server',
        object: 'payment_intent',
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          orderId: 'test-order-webhook-server'
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_webhook_server',
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

  console.log('📦 Enviando webhook de prueba...');
  console.log('Payload:', payloadString.substring(0, 100) + '...');
  console.log('Signature:', stripeSignature.substring(0, 50) + '...');

  try {
    const response = await axios.post('http://localhost:3001/payments/webhook', payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature
      }
    });

    console.log('✅ Webhook procesado exitosamente');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Error en webhook:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.data?.details) {
      console.log('Detalles del error:');
      console.log('- Has raw body:', error.response.data.details.hasRawBody);
      console.log('- Raw body length:', error.response.data.details.rawBodyLength);
      console.log('- Has signature:', error.response.data.details.hasSignature);
      console.log('- Signature length:', error.response.data.details.signatureLength);
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    console.log('\n🔗 Probando webhook...');
    await testWebhook();
  }
  
  console.log('\n📋 Resumen:');
  console.log('1. Verifica que el servidor esté corriendo');
  console.log('2. Verifica la configuración de body-parser en main.ts');
  console.log('3. Verifica los logs del servidor para más detalles');
  console.log('4. Verifica la configuración en Stripe Dashboard');
}

runTests();
