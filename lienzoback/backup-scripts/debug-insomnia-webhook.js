const http = require('http');
const crypto = require('crypto');

// Configuración
const WEBHOOK_SECRET = 'whsec_5a2625c0d3af7418734a74c0b6245707846ebf18e674ce2eaf996ac34d958ec4';
const WEBHOOK_URL = 'http://localhost:3001/payments/webhook';

// Payload exacto para Insomnia
const payload = {
  "id": "evt_test_insomnia_debug",
  "object": "event",
  "api_version": "2025-07-30",
  "created": Math.floor(Date.now() / 1000),
  "data": {
    "object": {
      "id": "pi_test_payment_intent_insomnia_debug",
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
    "id": "req_test_request_insomnia_debug",
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

// Función para hacer la petición
function testInsomniaWebhook() {
  const payloadString = JSON.stringify(payload);
  const signature = createStripeSignature(payload, WEBHOOK_SECRET);
  
  console.log('🔍 DIAGNÓSTICO PARA INSOMNIA');
  console.log('============================');
  console.log('');
  console.log('📋 CONFIGURACIÓN EXACTA:');
  console.log('URL:', WEBHOOK_URL);
  console.log('Method: POST');
  console.log('');
  console.log('📋 Headers (copia exactamente):');
  console.log('Content-Type: application/json');
  console.log(`stripe-signature: ${signature}`);
  console.log('');
  console.log('📋 Body (JSON - copia exactamente):');
  console.log(payloadString);
  console.log('');
  console.log('📊 Información de debug:');
  console.log('Payload length:', payloadString.length);
  console.log('Timestamp:', Math.floor(Date.now() / 1000));
  console.log('Webhook Secret (primeros 20 chars):', WEBHOOK_SECRET.substring(0, 20) + '...');
  console.log('');
  
  // Hacer la petición para verificar
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/payments/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadString),
      'stripe-signature': signature,
      'User-Agent': 'Insomnia/2023.5.8'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 RESPUESTA DEL SERVIDOR:');
      console.log('==========================');
      console.log('Status:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      console.log('Body:', data);
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('');
        console.log('✅ WEBHOOK FUNCIONANDO - Si Insomnia falla, el problema está en la configuración');
        console.log('');
        console.log('🔧 POSIBLES PROBLEMAS EN INSOMNIA:');
        console.log('1. Verifica que el Content-Type sea exactamente: application/json');
        console.log('2. Verifica que el stripe-signature no tenga espacios extra');
        console.log('3. Verifica que el JSON esté bien formateado (sin espacios extra)');
        console.log('4. Asegúrate de que el servidor esté corriendo en puerto 3001');
      } else {
        console.log('');
        console.log('❌ WEBHOOK CON ERROR - Revisa los logs del servidor');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error en la petición:', error.message);
    console.log('');
    console.log('🔧 VERIFICACIONES:');
    console.log('1. ¿El servidor está corriendo? (npm run start:dev)');
    console.log('2. ¿El puerto 3001 está disponible?');
    console.log('3. ¿Hay algún firewall bloqueando?');
  });

  req.write(payloadString);
  req.end();
}

// Ejecutar el diagnóstico
testInsomniaWebhook();
