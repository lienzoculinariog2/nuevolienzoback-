const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

console.log('🧪 PRUEBA PASO A PASO DEL WEBHOOK');
console.log('==================================\n');

const RENDER_URL = 'https://nuevolienzoback.onrender.com';

async function testWebhookStepByStep() {
  try {
    // Verificar configuración
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log('❌ STRIPE_WEBHOOK_SECRET no configurado');
      return;
    }
    
    console.log('✅ Webhook secret configurado');
    
    // Paso 1: Probar sin firma (debe dar error)
    console.log('\n📋 Paso 1: Probar sin firma de Stripe');
    try {
      const response1 = await axios.post(`${RENDER_URL}/payments/webhook`, { test: true }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`   Status: ${response1.status}`);
      console.log(`   Response: ${JSON.stringify(response1.data)}`);
      
      if (response1.status === 400 && response1.data.error === 'No stripe-signature header') {
        console.log('   ✅ Error esperado - endpoint funciona correctamente');
      } else {
        console.log('   ⚠️  Respuesta inesperada');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Paso 2: Probar con firma inválida
    console.log('\n📋 Paso 2: Probar con firma inválida');
    try {
      const response2 = await axios.post(`${RENDER_URL}/payments/webhook`, { test: true }, {
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 't=1234567890,v1=invalid_signature'
        },
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`   Status: ${response2.status}`);
      console.log(`   Response: ${JSON.stringify(response2.data)}`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Paso 3: Probar con firma válida
    console.log('\n📋 Paso 3: Probar con firma válida');
    
    const testPayload = {
      id: 'evt_test_step_by_step',
      object: 'event',
      api_version: '2025-07-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_step_by_step',
          object: 'payment_intent',
          amount: 1000,
          currency: 'usd',
          status: 'succeeded'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_step_by_step',
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
    
    try {
      const response3 = await axios.post(`${RENDER_URL}/payments/webhook`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': stripeSignature
        },
        timeout: 10000,
        validateStatus: () => true
      });
      
      console.log(`   Status: ${response3.status}`);
      console.log(`   Response: ${JSON.stringify(response3.data)}`);
      
      if (response3.status === 200) {
        console.log('   ✅ ¡Webhook funcionando correctamente!');
      } else {
        console.log('   ⚠️  Respuesta inesperada');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Paso 4: Verificar logs en Render
    console.log('\n📋 Paso 4: Verificar logs en Render');
    console.log('   1. Ve a Render Dashboard');
    console.log('   2. Selecciona el servicio lienzoback');
    console.log('   3. Ve a la pestaña "Logs"');
    console.log('   4. Busca mensajes como:');
    console.log('      - "🔍 Webhook received:"');
    console.log('      - "✅ Stripe signature detected"');
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

// Ejecutar pruebas
testWebhookStepByStep().then(() => {
  console.log('\n✅ Pruebas completadas');
}).catch((error) => {
  console.log('\n❌ Error en pruebas:', error.message);
});
