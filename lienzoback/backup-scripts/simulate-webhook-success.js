const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001';
const WEBHOOK_SECRET = 'whsec_5a2625c0d3af7418734a74c0b6245707846ebf18e674ce2eaf996ac34d958ec4'; // Del Stripe CLI
const PAYMENT_INTENT_ID = 'pi_3S0qcqLWWaXlaJCi1EiaJcrk';
const ORDER_ID = '230b954f-05e8-4f0b-84b4-eb956fcbbe68';

async function simulateWebhookSuccess() {
  console.log('🧪 ===== SIMULANDO WEBHOOK DE PAGO EXITOSO =====');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`💳 Payment Intent ID: ${PAYMENT_INTENT_ID}`);
  console.log(`📋 Order ID: ${ORDER_ID}`);
  console.log('');

  // Crear el payload del webhook
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    id: 'evt_test_webhook_success',
    object: 'event',
    api_version: '2025-07-30.basil',
    created: timestamp,
    data: {
      object: {
        id: PAYMENT_INTENT_ID,
        object: 'payment_intent',
        amount: 550,
        amount_capturable: 0,
        amount_details: {
          tip: {}
        },
        amount_received: 550,
        application: null,
        application_fee_amount: null,
        automatic_payment_methods: {
          allow_redirects: 'always',
          enabled: true
        },
        canceled_at: null,
        cancellation_reason: null,
        capture_method: 'automatic',
        client_secret: `${PAYMENT_INTENT_ID}_secret_test`,
        confirmation_method: 'automatic',
        created: timestamp,
        currency: 'usd',
        customer: null,
        description: `Pago para orden #${ORDER_ID}`,
        last_payment_error: null,
        latest_charge: 'ch_test_charge_success',
        livemode: false,
        metadata: {
          orderId: ORDER_ID,
          itemCount: '1',
          totalAmount: '5.5'
        },
        next_action: null,
        on_behalf_of: null,
        payment_method: 'pm_test_payment_method',
        payment_method_options: {
          card: {
            installments: null,
            mandate_options: null,
            network: null,
            request_three_d_secure: 'automatic'
          }
        },
        payment_method_types: ['card'],
        processing: null,
        receipt_email: 'test@example.com',
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: 'succeeded',
        transfer_data: null,
        transfer_group: null
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_webhook_request',
      idempotency_key: null
    },
    type: 'payment_intent.succeeded'
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');

  const stripeSignature = `t=${timestamp},v1=${signature}`;

  console.log('📦 Payload creado:');
  console.log(`   📋 Event type: ${payload.type}`);
  console.log(`   💳 Payment Intent ID: ${payload.data.object.id}`);
  console.log(`   📊 Status: ${payload.data.object.status}`);
  console.log(`   💰 Amount: ${payload.data.object.amount}`);
  console.log(`   📋 Order ID: ${payload.data.object.metadata.orderId}`);
  console.log('');

  try {
    console.log('🚀 Enviando webhook al servidor...');
    const response = await axios.post(`${BASE_URL}/payments/webhook`, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      }
    });

    console.log('✅ Webhook enviado exitosamente');
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📋 Response data: ${JSON.stringify(response.data, null, 2)}`);
    console.log('');

    // Esperar un momento y verificar el estado
    console.log('⏳ Esperando 5 segundos para que se procese...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');

    // Verificar estado final
    console.log('🔍 Verificando estado final...');
    const orderStatusResponse = await axios.get(`${BASE_URL}/payments/order-status/${ORDER_ID}`);
    console.log('📊 Estado final de la orden:', JSON.stringify(orderStatusResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error enviando webhook:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('🔍 Detalles del error:', JSON.stringify(error.response.data.details, null, 2));
    }
  }
}

simulateWebhookSuccess().catch(console.error);
