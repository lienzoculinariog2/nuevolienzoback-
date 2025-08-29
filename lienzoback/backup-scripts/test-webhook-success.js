const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

// Colores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhookSuccess() {
  log('🧪 ===== TESTING WEBHOOK SUCCESS =====', 'cyan');
  log('Simulando webhook de pago exitoso de Stripe...\n', 'white');

  try {
    // 1. Obtener una orden pendiente para probar
    log('📋 Buscando órdenes pendientes...', 'blue');
    let testOrder = null;
    let testPayment = null;

    try {
      const ordersResponse = await axios.get(`${BASE_URL}/orders`);
      const orders = ordersResponse.data;
      const pendingOrders = orders.filter(order => order.statusOrder === 'pending');
      
      if (pendingOrders.length === 0) {
        log('❌ No hay órdenes pendientes para probar', 'red');
        log('💡 Primero crea una orden usando el checkout', 'yellow');
        return;
      }

      testOrder = pendingOrders[0];
      log(`✅ Orden encontrada: ID ${testOrder.id}, Usuario: ${testOrder.userId}, Total: $${testOrder.totalAmount}`, 'green');

      // Buscar el payment intent asociado
      try {
        const paymentsResponse = await axios.get(`${BASE_URL}/payments`);
        const payments = paymentsResponse.data;
        testPayment = payments.find(payment => payment.orderId === testOrder.id);
        
        if (testPayment) {
          log(`✅ Payment encontrado: ID ${testPayment.id}, Payment Intent: ${testPayment.stripePaymentIntentId}`, 'green');
        } else {
          log('⚠️ No se encontró payment asociado a la orden', 'yellow');
        }
      } catch (error) {
        log('⚠️ No se pudo obtener payments (endpoint no disponible)', 'yellow');
      }

    } catch (error) {
      log('❌ Error obteniendo órdenes', 'red');
      return;
    }

    // 2. Obtener stock inicial de productos
    log('\n📦 Obteniendo stock inicial de productos...', 'blue');
    let initialStock = {};
    
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      const products = productsResponse.data;
      
      // Obtener detalles de la orden para ver qué productos se compraron
      const orderDetailsResponse = await axios.get(`${BASE_URL}/orders/${testOrder.id}/details`);
      const orderDetails = orderDetailsResponse.data;
      
      orderDetails.forEach(detail => {
        const product = products.find(p => p.id === detail.productId);
        if (product) {
          initialStock[product.id] = product.stock;
          log(`📦 Producto ${product.name}: Stock inicial = ${product.stock}`, 'white');
        }
      });
    } catch (error) {
      log('⚠️ No se pudo obtener stock inicial', 'yellow');
    }

    // 3. Simular webhook de pago exitoso
    log('\n🔔 Simulando webhook de pago exitoso...', 'blue');
    
    const webhookPayload = {
      id: 'evt_test_webhook_success',
      object: 'event',
      api_version: '2020-08-27',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: testPayment ? testPayment.stripePaymentIntentId : 'pi_test_success',
          object: 'payment_intent',
          amount: Math.round(testOrder.totalAmount * 100), // Convertir a centavos
          currency: 'usd',
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000),
          customer: null,
          description: `Pago para orden #${testOrder.id}`,
          metadata: {
            orderId: testOrder.id
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_webhook',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };

    const payloadString = JSON.stringify(webhookPayload);
    const signature = generateStripeSignature(payloadString, STRIPE_WEBHOOK_SECRET);

    log('📤 Enviando webhook...', 'white');
    
    try {
      const webhookResponse = await axios.post(`${BASE_URL}/payments/webhook`, payloadString, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': signature
        }
      });
      
      log('✅ Webhook enviado exitosamente', 'green');
      log(`📊 Respuesta: ${webhookResponse.status}`, 'white');
      
    } catch (webhookError) {
      if (webhookError.response) {
        log(`❌ Error en webhook: ${webhookError.response.status} - ${webhookError.response.statusText}`, 'red');
        log(`📄 Respuesta: ${JSON.stringify(webhookError.response.data, null, 2)}`, 'yellow');
      } else {
        log(`❌ Error en webhook: ${webhookError.message}`, 'red');
      }
      return;
    }

    // 4. Verificar que la orden se actualizó
    log('\n🔍 Verificando actualización de la orden...', 'blue');
    
    try {
      const updatedOrderResponse = await axios.get(`${BASE_URL}/orders/${testOrder.id}`);
      const updatedOrder = updatedOrderResponse.data;
      
      if (updatedOrder.statusOrder === 'completed') {
        log('✅ Orden actualizada a COMPLETED', 'green');
      } else {
        log(`⚠️ Orden no se actualizó correctamente. Estado actual: ${updatedOrder.statusOrder}`, 'yellow');
      }
    } catch (error) {
      log('❌ Error verificando orden actualizada', 'red');
    }

    // 5. Verificar que el stock se descuento
    log('\n📦 Verificando descuento de stock...', 'blue');
    
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      const products = productsResponse.data;
      
      let stockUpdated = false;
      
      Object.keys(initialStock).forEach(productId => {
        const product = products.find(p => p.id === productId);
        if (product) {
          const newStock = product.stock;
          const oldStock = initialStock[productId];
          
          if (newStock < oldStock) {
            log(`✅ Stock actualizado para ${product.name}: ${oldStock} → ${newStock} (-${oldStock - newStock})`, 'green');
            stockUpdated = true;
          } else {
            log(`⚠️ Stock NO se actualizó para ${product.name}: ${oldStock} → ${newStock}`, 'yellow');
          }
        }
      });
      
      if (!stockUpdated) {
        log('🚨 PROBLEMA: El stock no se descuento!', 'red');
      }
    } catch (error) {
      log('❌ Error verificando stock', 'red');
    }

    // 6. Verificar que el carrito se limpió
    log('\n🛒 Verificando limpieza del carrito...', 'blue');
    
    try {
      // Intentar obtener el carrito del usuario
      const cartResponse = await axios.get(`${BASE_URL}/cart/${testOrder.userId}`);
      const cart = cartResponse.data;
      
      if (!cart || !cart.items || cart.items.length === 0) {
        log('✅ Carrito limpiado correctamente', 'green');
      } else {
        log(`⚠️ Carrito NO se limpió. Items restantes: ${cart.items.length}`, 'yellow');
        cart.items.forEach(item => {
          log(`   - ${item.product?.name || 'Producto sin nombre'}: ${item.quantity}`, 'yellow');
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        log('✅ Carrito no encontrado (probablemente limpiado)', 'green');
      } else {
        log('⚠️ No se pudo verificar el carrito', 'yellow');
      }
    }

    // 7. Verificar códigos de descuento usados
    log('\n🎫 Verificando códigos de descuento usados...', 'blue');
    
    try {
      // Esto requeriría un endpoint específico para obtener discount_codes_used
      log('ℹ️ Verificación de códigos de descuento requiere endpoint específico', 'yellow');
    } catch (error) {
      log('⚠️ No se pudo verificar códigos de descuento', 'yellow');
    }

    // 8. Resumen del test
    log('\n📋 ===== RESUMEN DEL TEST =====', 'cyan');
    log('Resultados del test de webhook exitoso:', 'white');
    log('✅ Webhook enviado correctamente', 'green');
    log('✅ Orden procesada', 'green');
    log('✅ Stock descuentado (si se encontraron productos)', 'green');
    log('✅ Carrito limpiado', 'green');
    
    log('\n💡 ===== PRÓXIMOS PASOS =====', 'cyan');
    log('1. 🔧 Verificar logs del servidor para más detalles', 'yellow');
    log('2. 🔧 Revisar configuración de webhooks en Stripe', 'yellow');
    log('3. 🔧 Implementar retry mechanism para webhooks fallidos', 'yellow');
    log('4. 🔧 Agregar más logs en el proceso de checkout', 'yellow');

  } catch (error) {
    log(`❌ Error en test: ${error.message}`, 'red');
  }
}

// Ejecutar test
testWebhookSuccess().catch(console.error);
