const axios = require('axios');

console.log('⏰ ESPERANDO A QUE EL SERVIDOR ESTÉ LISTO');
console.log('=========================================\n');

const RENDER_URL = 'https://lienzoback.onrender.com';
const MAX_ATTEMPTS = 60; // 10 minutos máximo
const DELAY = 10000; // 10 segundos entre intentos

async function checkServerReady(attempt = 1) {
  try {
    console.log(`🔄 Intento ${attempt}/${MAX_ATTEMPTS} - Verificando servidor...`);
    
    // Probar el endpoint de health
    const response = await axios.get(`${RENDER_URL}/health`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('✅ ¡Servidor funcionando!');
      console.log('📊 Respuesta del servidor:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // Probar el endpoint raíz
      try {
        const rootResponse = await axios.get(`${RENDER_URL}/`, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        if (rootResponse.status === 200) {
          console.log('\n✅ Endpoint raíz funcionando:');
          console.log(JSON.stringify(rootResponse.data, null, 2));
        }
      } catch (error) {
        console.log('⚠️  Endpoint raíz no responde aún');
      }
      
      return true;
    } else {
      console.log(`⚠️  Servidor responde con status ${response.status}`);
      return false;
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('⏳ Servidor aún no está listo...');
    } else {
      console.log(`⚠️  Error: ${error.message}`);
    }
    return false;
  }
}

async function waitForServer() {
  console.log('🚀 Iniciando monitoreo del servidor...');
  console.log(`⏰ Verificando cada ${DELAY/1000} segundos`);
  console.log(`⏱️  Tiempo máximo de espera: ${(MAX_ATTEMPTS * DELAY) / 60000} minutos\n`);
  
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const isReady = await checkServerReady(attempt);
    
    if (isReady) {
      console.log('\n🎉 ¡SERVIDOR LISTO!');
      console.log('==================');
      console.log('✅ Servidor funcionando');
      console.log('✅ Endpoints de health disponibles');
      console.log('✅ Listo para probar webhooks');
      
      console.log('\n🔍 PRÓXIMOS PASOS:');
      console.log('1. Probar webhook con Stripe');
      console.log('2. Verificar que los webhooks funcionen');
      console.log('3. Realizar transacción de prueba');
      
      return;
    }
    
    if (attempt < MAX_ATTEMPTS) {
      console.log(`⏳ Esperando ${DELAY/1000} segundos...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY));
    }
  }
  
  console.log('\n❌ TIEMPO DE ESPERA AGOTADO');
  console.log('============================');
  console.log('El servidor no respondió en el tiempo esperado.');
  console.log('Posibles causas:');
  console.log('1. El deploy está tomando más tiempo del esperado');
  console.log('2. Hay errores en el deploy');
  console.log('3. Problemas de configuración en Render');
  
  console.log('\n🔧 ACCIONES RECOMENDADAS:');
  console.log('1. Verificar en Render Dashboard el estado del deploy');
  console.log('2. Revisar logs de build y runtime');
  console.log('3. Verificar configuración de Build & Deploy');
  console.log('4. Intentar manualmente más tarde');
}

// Función para probar webhook una vez que el servidor esté listo
async function testWebhookOnceReady() {
  console.log('\n🧪 Probando webhook una vez que el servidor esté listo...');
  
  try {
    const crypto = require('crypto');
    require('dotenv').config({ path: '.env.development' });
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log('❌ STRIPE_WEBHOOK_SECRET no configurado');
      return;
    }
    
    const testPayload = {
      id: 'evt_test_server_ready',
      object: 'event',
      api_version: '2025-07-30.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_test_server_ready',
          object: 'payment_intent',
          amount: 1000,
          currency: 'usd',
          status: 'succeeded'
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_server_ready',
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
      console.log('✅ ¡Webhook funcionando correctamente!');
    } else {
      console.log(`⚠️  Webhook responde con status ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Error probando webhook: ${error.message}`);
  }
}

// Iniciar monitoreo
waitForServer().then(() => {
  // Una vez que el servidor esté listo, probar el webhook
  setTimeout(testWebhookOnceReady, 2000);
}).catch(console.error);
