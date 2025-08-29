const crypto = require('crypto');
const http = require('http');

// Configuración con variables reales de Stripe
const WEBHOOK_SECRET = 'whsec_5a2625c0d3af7418734a74c0b6245707846ebf18e674ce2eaf996ac34d958ec4';
const WEBHOOK_URL = 'http://localhost:3001/payments/webhook';

// Payload de prueba (simula un payment_intent.succeeded)
const payload = {
  id: 'evt_test_webhook_real',
  object: 'event',
  api_version: '2025-07-30',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_payment_intent_real',
      object: 'payment_intent',
      amount: 1500,
      currency: 'usd',
      status: 'succeeded'
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_request_real',
    idempotency_key: null
  },
  type: 'payment_intent.succeeded'
};

// Crear firma de Stripe
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

// Función para hacer la petición
function testWebhook() {
  const payloadString = JSON.stringify(payload);
  const signature = createStripeSignature(payload, WEBHOOK_SECRET);
  
  console.log('🔍 PROBANDO WEBHOOK CON CREDENCIALES REALES');
  console.log('==========================================');
  console.log('URL:', WEBHOOK_URL);
  console.log('Payload length:', payloadString.length);
  console.log('Signature:', signature.substring(0, 50) + '...');
  console.log('Webhook Secret:', WEBHOOK_SECRET.substring(0, 20) + '...');
  console.log('');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/payments/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString),
      'stripe-signature': signature,
      'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 RESPUESTA DEL WEBHOOK:');
      console.log('========================');
      console.log('Status:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      console.log('Body:', data);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ WEBHOOK FUNCIONANDO CORRECTAMENTE');
        console.log('🎉 ¡El webhook está configurado y funcionando!');
      } else {
        console.log('❌ WEBHOOK CON ERROR');
        console.log('💡 SUGERENCIA: Verifica que el webhook secret sea correcto');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error.message);
  });

  req.write(payloadString);
  req.end();
}

// Ejecutar la prueba
testWebhook();
