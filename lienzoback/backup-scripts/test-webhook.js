const crypto = require('crypto');
const http = require('http');

// Configuración
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
const WEBHOOK_URL = 'http://localhost:3001/payments/webhook';

// Payload de prueba (simula un payment_intent.succeeded)
const payload = {
  id: 'evt_test_webhook',
  object: 'event',
  api_version: '2025-07-30',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'pi_test_payment_intent',
      object: 'payment_intent',
      amount: 1500,
      currency: 'usd',
      status: 'succeeded'
    }
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: 'req_test_request',
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
  
  console.log('🔍 PROBANDO WEBHOOK');
  console.log('===================');
  console.log('URL:', WEBHOOK_URL);
  console.log('Payload length:', payloadString.length);
  console.log('Signature:', signature.substring(0, 50) + '...');
  console.log('Webhook Secret:', WEBHOOK_SECRET);
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
      
      if (res.statusCode === 200) {
        console.log('✅ WEBHOOK FUNCIONANDO CORRECTAMENTE');
      } else {
        console.log('❌ WEBHOOK CON ERROR');
        console.log('💡 SUGERENCIA: Verifica que el STRIPE_WEBHOOK_SECRET en tu .env coincida');
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
