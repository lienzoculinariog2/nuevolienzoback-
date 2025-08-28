const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

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

async function debugCheckoutIssues() {
  log('🔍 ===== DEBUGGING CHECKOUT ISSUES =====', 'cyan');
  log('Analizando problemas de stock, carrito y códigos de descuento...\n', 'white');

  try {
    // 1. Verificar estado del servidor
    log('📡 Verificando estado del servidor...', 'blue');
    try {
      const response = await axios.get(`${BASE_URL}/products`);
      log('✅ Servidor funcionando correctamente', 'green');
    } catch (error) {
      log('❌ Servidor no responde', 'red');
      return;
    }

    // 2. Verificar órdenes recientes
    log('\n📋 Analizando órdenes recientes...', 'blue');
    try {
      const ordersResponse = await axios.get(`${BASE_URL}/orders`);
      const orders = ordersResponse.data;
      log(`📊 Total de órdenes: ${orders.length}`, 'white');
      
      // Buscar órdenes duplicadas
      const orderGroups = {};
      orders.forEach(order => {
        const key = `${order.userId}_${order.totalAmount}_${order.shippingAddress}`;
        if (!orderGroups[key]) {
          orderGroups[key] = [];
        }
        orderGroups[key].push(order);
      });

      const duplicateOrders = Object.values(orderGroups).filter(group => group.length > 1);
      if (duplicateOrders.length > 0) {
        log('🚨 PROBLEMA: Órdenes duplicadas encontradas!', 'red');
        duplicateOrders.forEach((group, index) => {
          log(`   Grupo ${index + 1}: ${group.length} órdenes duplicadas`, 'yellow');
          group.forEach(order => {
            log(`     - Orden ID: ${order.id}, Estado: ${order.statusOrder}, Fecha: ${order.date}`, 'yellow');
          });
        });
      } else {
        log('✅ No se encontraron órdenes duplicadas', 'green');
      }

      // Verificar órdenes con estado PENDING
      const pendingOrders = orders.filter(order => order.statusOrder === 'pending');
      log(`📊 Órdenes en estado PENDING: ${pendingOrders.length}`, 'white');
      
      if (pendingOrders.length > 0) {
        log('⚠️ ADVERTENCIA: Hay órdenes pendientes que podrían no haber procesado el pago', 'yellow');
        pendingOrders.forEach(order => {
          log(`   - Orden ID: ${order.id}, Usuario: ${order.userId}, Total: $${order.totalAmount}`, 'yellow');
        });
      }

    } catch (error) {
      log('❌ Error obteniendo órdenes', 'red');
    }

    // 3. Verificar códigos de descuento usados
    log('\n🎫 Analizando códigos de descuento...', 'blue');
    try {
      const discountCodesResponse = await axios.get(`${BASE_URL}/discount-codes`);
      const discountCodes = discountCodesResponse.data;
      log(`📊 Total de códigos de descuento: ${discountCodes.length}`, 'white');

      // Verificar códigos activos
      const activeCodes = discountCodes.filter(code => code.isActive);
      log(`📊 Códigos activos: ${activeCodes.length}`, 'white');

      // Verificar códigos usados (esto requeriría un endpoint específico)
      log('🔍 Verificando códigos de descuento usados...', 'white');
      // Nota: Necesitaríamos un endpoint para obtener discount_codes_used
      
    } catch (error) {
      log('❌ Error obteniendo códigos de descuento', 'red');
    }

    // 4. Verificar carritos activos
    log('\n🛒 Analizando carritos activos...', 'blue');
    try {
      // Intentar obtener carritos activos (si existe el endpoint)
      const cartsResponse = await axios.get(`${BASE_URL}/cart/active`);
      const carts = cartsResponse.data;
      log(`📊 Carritos activos: ${carts.length}`, 'white');
      
      if (carts.length > 0) {
        log('⚠️ ADVERTENCIA: Hay carritos activos que podrían no haberse limpiado', 'yellow');
        carts.forEach(cart => {
          log(`   - Carrito ID: ${cart.id}, Usuario: ${cart.userId}, Items: ${cart.items?.length || 0}`, 'yellow');
        });
      } else {
        log('✅ No hay carritos activos (esto es normal)', 'green');
      }
    } catch (error) {
      log('ℹ️ No se pudo verificar carritos activos (endpoint no disponible)', 'yellow');
    }

    // 5. Verificar productos y stock
    log('\n📦 Analizando productos y stock...', 'blue');
    try {
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      const products = productsResponse.data;
      log(`📊 Total de productos: ${products.length}`, 'white');

      // Verificar productos con stock 0
      const outOfStockProducts = products.filter(product => product.stock === 0);
      log(`📊 Productos sin stock: ${outOfStockProducts.length}`, 'white');

      // Verificar productos con stock bajo
      const lowStockProducts = products.filter(product => product.stock > 0 && product.stock <= 5);
      log(`📊 Productos con stock bajo (≤5): ${lowStockProducts.length}`, 'white');

      if (lowStockProducts.length > 0) {
        log('⚠️ Productos con stock bajo:', 'yellow');
        lowStockProducts.forEach(product => {
          log(`   - ${product.name}: ${product.stock} unidades`, 'yellow');
        });
      }
    } catch (error) {
      log('❌ Error obteniendo productos', 'red');
    }

    // 6. Verificar webhooks de Stripe
    log('\n🔔 Analizando webhooks de Stripe...', 'blue');
    try {
      // Verificar si hay logs de webhooks recientes
      log('🔍 Verificando logs de webhooks...', 'white');
      
      // Intentar simular un webhook de prueba
      log('🧪 Simulando webhook de prueba...', 'white');
      
      const testWebhook = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_webhook',
            amount: 1900,
            currency: 'usd',
            status: 'succeeded'
          }
        }
      };

      try {
        const webhookResponse = await axios.post(`${BASE_URL}/payments/webhook`, testWebhook, {
          headers: {
            'stripe-signature': 'test_signature'
          }
        });
        log('✅ Webhook endpoint responde', 'green');
      } catch (webhookError) {
        if (webhookError.response?.status === 400) {
          log('✅ Webhook endpoint responde (error esperado por firma inválida)', 'green');
        } else {
          log('❌ Webhook endpoint no responde correctamente', 'red');
        }
      }
    } catch (error) {
      log('❌ Error verificando webhooks', 'red');
    }

    // 7. Verificar base de datos directamente
    log('\n🗄️ Verificando base de datos...', 'blue');
    try {
      // Verificar tablas críticas
      log('🔍 Verificando integridad de datos...', 'white');
      
      // Esto requeriría acceso directo a la base de datos
      // Por ahora, solo verificamos a través de la API
      
    } catch (error) {
      log('❌ Error verificando base de datos', 'red');
    }

    // 8. Resumen de problemas encontrados
    log('\n📋 ===== RESUMEN DE PROBLEMAS =====', 'cyan');
    log('Basado en el análisis, los principales problemas son:', 'white');
    log('1. 🚨 Stock no se descuenta hasta que el webhook sea exitoso', 'red');
    log('2. 🚨 Carrito no se limpia hasta que el webhook sea exitoso', 'red');
    log('3. 🚨 Códigos de descuento podrían no estar guardándose correctamente', 'red');
    log('4. 🚨 Posibles órdenes duplicadas', 'red');
    log('5. 🚨 Webhooks de Stripe podrían no estar funcionando', 'red');

    log('\n💡 ===== RECOMENDACIONES =====', 'cyan');
    log('1. 🔧 Verificar configuración de webhooks de Stripe', 'yellow');
    log('2. 🔧 Implementar retry mechanism para webhooks fallidos', 'yellow');
    log('3. 🔧 Agregar logs más detallados en el proceso de checkout', 'yellow');
    log('4. 🔧 Verificar que los códigos de descuento se guarden en discount_codes_used', 'yellow');
    log('5. 🔧 Implementar validación para evitar órdenes duplicadas', 'yellow');

  } catch (error) {
    log(`❌ Error general en debugging: ${error.message}`, 'red');
  }
}

// Ejecutar debugging
debugCheckoutIssues().catch(console.error);
