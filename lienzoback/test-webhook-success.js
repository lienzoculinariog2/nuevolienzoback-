const axios = require('axios');
const crypto = require('crypto');

// Configuración
const BASE_URL = 'http://localhost:3001';
const WEBHOOK_SECRET = 'whsec_5a2625c0d3af7418734a74c0b6245707846ebf18e674ce2eaf996ac34d958ec4';

// Payload de webhook de pago exitoso
const webhookPayload = {
  "id": "evt_test_payment_success",
  "object": "event",
  "api_version": "2025-07-30",
  "created": Math.floor(Date.now() / 1000),
  "data": {
    "object": {
      "id": "pi_test_payment_success_123",
      "object": "payment_intent",
      "amount": 2500, // $25.00
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "orderId": "test-order-123",
        "itemCount": "2",
        "totalAmount": "25.00"
      },
      "client_secret": "pi_test_payment_success_123_secret_abc123",
      "created": Math.floor(Date.now() / 1000)
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_request_123",
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

// Función para probar el webhook
async function testWebhookSuccess() {
  try {
    console.log('🧪 ===== PROBANDO WEBHOOK DE PAGO EXITOSO =====');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🌐 URL: ${BASE_URL}/payments/webhook`);
    
    // Crear firma
    const signature = createStripeSignature(webhookPayload, WEBHOOK_SECRET);
    console.log(`🔑 Signature creada: ${signature.substring(0, 50)}...`);
    
    // Enviar webhook
    console.log('📤 Enviando webhook...');
    const response = await axios.post(`${BASE_URL}/payments/webhook`, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': signature
      }
    });
    
    console.log('✅ ===== WEBHOOK ENVIADO EXITOSAMENTE =====');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response: ${JSON.stringify(response.data, null, 2)}`);
    
  } catch (error) {
    console.error('❌ ===== ERROR EN WEBHOOK =====');
    console.error(`❌ Error message: ${error.message}`);
    
    if (error.response) {
      console.error(`❌ Response status: ${error.response.status}`);
      console.error(`❌ Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.request) {
      console.error('❌ No se recibió respuesta del servidor');
    }
  }
}

// Ejecutar prueba
testWebhookSuccess().catch(console.error);
