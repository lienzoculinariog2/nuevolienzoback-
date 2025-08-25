const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

console.log('🧪 PRUEBA MANUAL DEL WEBHOOK');
console.log('============================\n');

const RENDER_URL = 'https://nuevolienzoback.onrender.com';

async function testWebhookManual() {
  try {
    // Verificar webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log('❌ STRIPE_WEBHOOK_SECRET no configurado');
      return;
    }
    
    console.log('✅ Webhook secret configurado');
    
    // Crear payload de prueba
    const testPayload = {
      id: 'evt_test_manual_webhook',
      object: 'event',
      api_version: '2025-07-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_manual_webhook',
          object: 'payment_intent',
          amount: 1000,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            test: 'true'
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_manual_webhook',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };
    
    const payloadString = JSON.stringify(testPayload);
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generar firma válida
    const signedPayload = `${timestamp}.${payloadString}`;
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');
    
    const stripeSignature = `t=${timestamp},v1=${signature}`;
    
    console.log('📋 Información de la prueba:');
    console.log('URL:', `${RENDER_URL}/payments/webhook`);
    console.log('Event Type:', testPayload.type);
    console.log('Payment Intent ID:', testPayload.data.object.id);
    console.log('Timestamp:', timestamp);
    console.log('Signature:', stripeSignature.substring(0, 50) + '...');
    
    // Probar el webhook
    console.log('\n🚀 Probando webhook...');
    const response = await axios.post(`${RENDER_URL}/payments/webhook`, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`📡 Status: ${response.status}`);
    console.log(`📡 Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200) {
      console.log('✅ ¡Webhook funcionando correctamente!');
    } else if (response.status === 400) {
      console.log('⚠️  Webhook responde pero con error (puede ser normal para datos de prueba)');
    } else if (response.status === 404) {
      console.log('❌ Webhook endpoint no encontrado');
    } else {
      console.log(`⚠️  Webhook responde con status ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 El servidor no está disponible');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 URL no encontrada');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Timeout - servidor no responde');
    }
  }
}

// Ejecutar prueba
testWebhookManual().then(() => {
  console.log('\n✅ Prueba completada');
}).catch((error) => {
  console.log('\n❌ Error en prueba:', error.message);
});
