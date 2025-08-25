const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

console.log('🚀 VERIFICACIÓN DE ESTADO DEL DEPLOY');
console.log('====================================\n');

const RENDER_URL = 'https://lienzoback.onrender.com';

async function checkDeployStatus() {
  console.log('🔍 Verificando estado del deploy...');
  
  try {
    // Probar diferentes endpoints para ver cuál responde
    const endpoints = [
      { path: '/', name: 'Root' },
      { path: '/api', name: 'API' },
      { path: '/payments/webhook', name: 'Webhook' },
      { path: '/health', name: 'Health' },
      { path: '/swagger', name: 'Swagger' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${RENDER_URL}${endpoint.path}`, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        console.log(`📡 ${endpoint.name} (${endpoint.path}): ${response.status} - ${response.statusText}`);
        
        if (response.status === 200) {
          console.log(`   ✅ ${endpoint.name} responde correctamente`);
        } else if (response.status === 404) {
          console.log(`   ⚠️  ${endpoint.name} no encontrado (puede ser normal)`);
        } else {
          console.log(`   ⚠️  ${endpoint.name} responde con status ${response.status}`);
        }
        
      } catch (error) {
        console.log(`📡 ${endpoint.name} (${endpoint.path}): ❌ Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error general: ${error.message}`);
  }
}

async function testWebhookWithValidSignature() {
  console.log('\n🧪 Probando webhook con firma válida...');
  
  try {
    // Crear un payload de prueba con firma válida
    const crypto = require('crypto');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.log('❌ STRIPE_WEBHOOK_SECRET no configurado');
      return;
    }
    
    const testPayload = {
      id: 'evt_test_deploy_status',
      object: 'event',
      api_version: '2025-07-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_deploy_status',
          object: 'payment_intent',
          amount: 1000,
          currency: 'usd',
          status: 'succeeded'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_deploy_status',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };
    
    const payloadString = JSON.stringify(testPayload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payloadString}`;
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');
    
    const stripeSignature = `t=${timestamp},v1=${signature}`;
    
    const response = await axios.post(`${RENDER_URL}/payments/webhook`, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature
      },
      timeout: 10000,
      validateStatus: () => true
    });
    
    console.log(`📡 Webhook Status: ${response.status}`);
    console.log(`📡 Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 200) {
      console.log('✅ Webhook funciona correctamente');
    } else if (response.status === 400) {
      console.log('⚠️  Webhook responde pero con error (puede ser normal para datos de prueba)');
    } else if (response.status === 404) {
      console.log('❌ Webhook endpoint no encontrado - posible problema con el deploy');
    } else {
      console.log(`⚠️  Webhook responde con status ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error probando webhook: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 El servidor puede estar en proceso de deploy');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 Verificar que la URL sea correcta');
    }
  }
}

async function main() {
  await checkDeployStatus();
  await testWebhookWithValidSignature();
  
  console.log('\n📊 DIAGNÓSTICO:');
  console.log('===============');
  console.log('Si todos los endpoints devuelven 404:');
  console.log('1. El servidor puede estar en proceso de deploy');
  console.log('2. Verificar en Render Dashboard el estado del deploy');
  console.log('3. Revisar logs de build en Render');
  console.log('4. Verificar que no hay errores de compilación');
  
  console.log('\n🔧 ACCIONES RECOMENDADAS:');
  console.log('1. Ir a https://dashboard.render.com');
  console.log('2. Seleccionar el servicio lienzoback');
  console.log('3. Verificar estado del deploy en la pestaña "Events"');
  console.log('4. Revisar logs de build para errores');
  console.log('5. Si hay errores, revisar la configuración del proyecto');
  
  console.log('\n⏰ TIEMPO DE ESPERA:');
  console.log('- Los deploys en Render pueden tomar 5-10 minutos');
  console.log('- Verificar cada 2-3 minutos el estado');
  console.log('- Los logs aparecen en tiempo real en el dashboard');
}

main().catch(console.error);
