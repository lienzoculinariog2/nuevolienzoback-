const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Datos de prueba
const testOrderId = 'test-order-123';
const testPaymentData = {
  amount: 99.99,
  currency: 'usd',
  orderId: testOrderId,
  customerEmail: 'test@example.com',
  description: 'Test payment for order',
  items: [
    {
      productId: 'product-1',
      quantity: 2,
      price: 49.99
    }
  ]
};

async function testPayments() {
  console.log('🧪 Testing Stripe Payments Integration\n');

  try {
    // 1. Crear Payment Intent
    console.log('1. Creating Payment Intent...');
    const createResponse = await axios.post(`${BASE_URL}/payments/create-payment-intent`, testPaymentData);
    console.log('✅ Payment Intent created:', createResponse.data);
    
    const { paymentIntentId, clientSecret } = createResponse.data;

    // 2. Obtener detalles del Payment Intent
    console.log('\n2. Getting Payment Intent details...');
    const getResponse = await axios.get(`${BASE_URL}/payments/${paymentIntentId}`);
    console.log('✅ Payment Intent details:', getResponse.data);

    // 3. Crear Payment Intent para una orden específica
    console.log('\n3. Creating Payment Intent for specific order...');
    const orderPaymentResponse = await axios.post(
      `${BASE_URL}/payments/order/${testOrderId}/create-payment`, 
      testPaymentData
    );
    console.log('✅ Order Payment Intent created:', orderPaymentResponse.data);

    // 4. Obtener estado de pago de la orden
    console.log('\n4. Getting order payment status...');
    const statusResponse = await axios.get(`${BASE_URL}/payments/order/${testOrderId}/payment-status`);
    console.log('✅ Order payment status:', statusResponse.data);

    // 5. Probar cancelación (opcional)
    console.log('\n5. Testing payment cancellation...');
    try {
      const cancelResponse = await axios.post(`${BASE_URL}/payments/cancel/${paymentIntentId}`);
      console.log('✅ Payment Intent canceled:', cancelResponse.data);
    } catch (error) {
      console.log('⚠️  Cancelation test failed (might be expected):', error.response?.data || error.message);
    }

    console.log('\n🎉 All payment tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 This might be expected if Stripe keys are not configured.');
      console.log('   Make sure to set up your Stripe environment variables:');
      console.log('   - STRIPE_SECRET_KEY');
      console.log('   - STRIPE_PUBLISHABLE_KEY');
      console.log('   - STRIPE_WEBHOOK_SECRET');
    }
  }
}

// Función para probar webhooks (simulación)
async function testWebhook() {
  console.log('\n🔗 Testing Webhook Endpoint...');
  
  try {
    const webhookData = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_webhook',
          amount: 9999,
          currency: 'usd',
          status: 'succeeded'
        }
      }
    };

    const response = await axios.post(`${BASE_URL}/payments/webhook`, webhookData, {
      headers: {
        'stripe-signature': 'test_signature'
      }
    });
    
    console.log('✅ Webhook test response:', response.data);
  } catch (error) {
    console.log('⚠️  Webhook test failed (expected without proper signature):', error.response?.data || error.message);
  }
}

// Función para mostrar información de configuración
function showConfigurationInfo() {
  console.log('📋 Configuration Information:');
  console.log('   Base URL:', BASE_URL);
  console.log('   Test Order ID:', testOrderId);
  console.log('   Test Amount:', testPaymentData.amount);
  console.log('   Test Currency:', testPaymentData.currency);
  console.log('');
}

// Ejecutar pruebas
async function runTests() {
  showConfigurationInfo();
  await testPayments();
  await testWebhook();
  
  console.log('\n📚 Next Steps:');
  console.log('1. Configure your Stripe keys in .env file');
  console.log('2. Test with real Stripe test cards');
  console.log('3. Set up webhook endpoints in Stripe dashboard');
  console.log('4. Integrate with your frontend application');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPayments,
  testWebhook,
  runTests
};
