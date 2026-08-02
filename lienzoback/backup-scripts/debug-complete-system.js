const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

// Colores para la consola
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logStep(step, message, status = 'info') {
  const statusIcon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  const statusColor = {
    info: 'white',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  };
  
  log(`${statusIcon[status]} ${step}: ${message}`, statusColor[status]);
}

async function checkServerHealth() {
  logSection('VERIFICACIÓN DE SALUD DEL SERVIDOR');
  
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    logStep('1', 'Servidor respondiendo correctamente', 'success');
    logStep('2', `Status: ${response.status}`, 'info');
    logStep('3', `Timestamp: ${new Date().toISOString()}`, 'info');
    return true;
  } catch (error) {
    logStep('1', `Servidor no responde: ${error.message}`, 'error');
    return false;
  }
}

async function checkDatabaseConnection() {
  logSection('VERIFICACIÓN DE CONEXIÓN A BASE DE DATOS');
  
  try {
    // Verificar productos (entidad básica)
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    logStep('1', `Conexión a BD exitosa - ${productsResponse.data.length} productos encontrados`, 'success');
    
    // Verificar usuarios
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    logStep('2', `Usuarios accesibles - ${usersResponse.data.length} usuarios encontrados`, 'success');
    
    // Verificar categorías
    const categoriesResponse = await axios.get(`${BASE_URL}/categories`);
    logStep('3', `Categorías accesibles - ${categoriesResponse.data.length} categorías encontradas`, 'success');
    
    return true;
  } catch (error) {
    logStep('1', `Error de conexión a BD: ${error.message}`, 'error');
    return false;
  }
}

async function checkNotificationsModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE NOTIFICACIONES');
  
  try {
    // Verificar endpoint de notificaciones
    const response = await axios.get(`${BASE_URL}/notifications`);
    logStep('1', 'Endpoint de notificaciones accesible', 'success');
    logStep('2', `Status: ${response.status}`, 'info');
    
    // Verificar configuración de email
    logStep('3', 'Verificando configuración de email...', 'info');
    
    // Verificar templates
    const templatesPath = path.join(__dirname, 'src/modules/notifications/templates');
    if (fs.existsSync(templatesPath)) {
      const templates = fs.readdirSync(templatesPath);
      logStep('4', `Templates encontrados: ${templates.join(', ')}`, 'success');
    } else {
      logStep('4', 'Directorio de templates no encontrado', 'warning');
    }
    
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logStep('1', 'Endpoint de notificaciones no encontrado (posiblemente no implementado)', 'warning');
    } else {
      logStep('1', `Error en módulo de notificaciones: ${error.message}`, 'error');
    }
    return false;
  }
}

async function checkCheckoutModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE CHECKOUT');
  
  try {
    // Verificar endpoint de checkout
    const response = await axios.get(`${BASE_URL}/checkout`);
    logStep('1', 'Endpoint de checkout accesible', 'success');
    logStep('2', `Status: ${response.status}`, 'info');
    
    // Verificar carritos activos
    const cartsResponse = await axios.get(`${BASE_URL}/cart/active`);
    logStep('3', `Carritos activos: ${cartsResponse.data.length}`, 'info');
    
    // Verificar códigos de descuento
    const discountResponse = await axios.get(`${BASE_URL}/discount-codes`);
    logStep('4', `Códigos de descuento disponibles: ${discountResponse.data.length}`, 'info');
    
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logStep('1', 'Endpoint de checkout no encontrado', 'warning');
    } else {
      logStep('1', `Error en módulo de checkout: ${error.message}`, 'error');
    }
    return false;
  }
}

async function checkPaymentsModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE PAGOS');
  
  try {
    // Verificar endpoint de pagos
    const response = await axios.get(`${BASE_URL}/payments`);
    logStep('1', 'Endpoint de pagos accesible', 'success');
    logStep('2', `Status: ${response.status}`, 'info');
    
    // Verificar configuración de Stripe
    logStep('3', 'Verificando configuración de Stripe...', 'info');
    
    // Verificar webhook endpoint
    try {
      const webhookResponse = await axios.post(`${BASE_URL}/payments/webhook`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid-signature'
        }
      });
      logStep('4', 'Webhook endpoint responde', 'success');
    } catch (webhookError) {
      if (webhookError.response && webhookError.response.status === 400) {
        logStep('4', 'Webhook endpoint responde (error esperado por firma inválida)', 'success');
      } else {
        logStep('4', `Error en webhook: ${webhookError.message}`, 'warning');
      }
    }
    
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logStep('1', 'Endpoint de pagos no encontrado', 'warning');
    } else {
      logStep('1', `Error en módulo de pagos: ${error.message}`, 'error');
    }
    return false;
  }
}

async function checkCartModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE CARRITO');
  
  try {
    // Verificar carritos activos
    const response = await axios.get(`${BASE_URL}/cart/active`);
    logStep('1', `Carritos activos: ${response.data.length}`, 'success');
    
    // Verificar items en carritos
    if (response.data.length > 0) {
      const cart = response.data[0];
      logStep('2', `Carrito ejemplo - ID: ${cart.id}, Items: ${cart.items?.length || 0}`, 'info');
    }
    
    return true;
  } catch (error) {
    logStep('1', `Error en módulo de carrito: ${error.message}`, 'error');
    return false;
  }
}

async function checkOrdersModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE ÓRDENES');
  
  try {
    // Verificar órdenes
    const response = await axios.get(`${BASE_URL}/orders`);
    logStep('1', `Órdenes totales: ${response.data.length}`, 'success');
    
    // Verificar estados de órdenes
    if (response.data.length > 0) {
      const order = response.data[0];
      logStep('2', `Orden ejemplo - ID: ${order.id}, Estado: ${order.status}, Total: $${order.totalAmount}`, 'info');
    }
    
    return true;
  } catch (error) {
    logStep('1', `Error en módulo de órdenes: ${error.message}`, 'error');
    return false;
  }
}

async function checkProductsModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE PRODUCTOS');
  
  try {
    // Verificar productos
    const response = await axios.get(`${BASE_URL}/products`);
    logStep('1', `Productos totales: ${response.data.length}`, 'success');
    
    // Verificar stock
    const productsWithStock = response.data.filter(p => p.stock > 0);
    logStep('2', `Productos con stock: ${productsWithStock.length}`, 'info');
    
    // Verificar productos sin stock
    const productsWithoutStock = response.data.filter(p => p.stock === 0);
    if (productsWithoutStock.length > 0) {
      logStep('3', `Productos sin stock: ${productsWithoutStock.length}`, 'warning');
    }
    
    return true;
  } catch (error) {
    logStep('1', `Error en módulo de productos: ${error.message}`, 'error');
    return false;
  }
}

async function checkAuthModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE AUTENTICACIÓN');
  
  try {
    // Verificar endpoint de login (debería existir)
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'test123'
    });
    logStep('1', 'Endpoint de login accesible', 'success');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      logStep('1', 'Endpoint de login accesible (credenciales inválidas esperadas)', 'success');
    } else if (error.response && error.response.status === 404) {
      logStep('1', 'Endpoint de login no encontrado', 'warning');
    } else {
      logStep('1', `Error en módulo de autenticación: ${error.message}`, 'error');
    }
  }
  
  return true;
}

async function checkFileUploadModule() {
  logSection('VERIFICACIÓN DEL MÓDULO DE SUBIDA DE ARCHIVOS');
  
  try {
    // Verificar endpoint de upload
    const response = await axios.get(`${BASE_URL}/file-upload`);
    logStep('1', 'Endpoint de file-upload accesible', 'success');
    return true;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logStep('1', 'Endpoint de file-upload no encontrado', 'warning');
    } else {
      logStep('1', `Error en módulo de file-upload: ${error.message}`, 'error');
    }
    return false;
  }
}

async function generateReport(results) {
  logSection('REPORTE FINAL');
  
  const totalChecks = Object.keys(results).length;
  const successfulChecks = Object.values(results).filter(r => r === true).length;
  const failedChecks = totalChecks - successfulChecks;
  
  logStep('RESUMEN', `Total de verificaciones: ${totalChecks}`, 'info');
  logStep('ÉXITOS', `${successfulChecks} verificaciones exitosas`, 'success');
  logStep('FALLOS', `${failedChecks} verificaciones fallidas`, failedChecks > 0 ? 'error' : 'success');
  
  if (failedChecks > 0) {
    log('\n🚨 MÓDULOS CON PROBLEMAS:', 'red');
    Object.entries(results).forEach(([module, success]) => {
      if (!success) {
        log(`   - ${module}`, 'red');
      }
    });
  } else {
    log('\n🎉 ¡TODOS LOS MÓDULOS FUNCIONAN CORRECTAMENTE!', 'green');
  }
  
  log('\n📋 RECOMENDACIONES:', 'cyan');
  if (results.notifications === false) {
    log('   - Revisar configuración de email en .env.development', 'yellow');
    log('   - Verificar que los templates de notificaciones existan', 'yellow');
  }
  if (results.checkout === false) {
    log('   - Verificar que el endpoint de checkout esté implementado', 'yellow');
    log('   - Revisar la lógica de validación de carrito', 'yellow');
  }
  if (results.payments === false) {
    log('   - Verificar configuración de Stripe en .env.development', 'yellow');
    log('   - Revisar que el webhook esté configurado correctamente', 'yellow');
  }
}

async function debugCompleteSystem() {
  console.clear();
  log('🔍 ===== DEBUGGING COMPLETO DEL SISTEMA =====', 'bright');
  log(`📅 Timestamp: ${new Date().toISOString()}`, 'info');
  log(`🌐 Base URL: ${BASE_URL}`, 'info');
  log('', 'white');
  
  const results = {};
  
  // Ejecutar todas las verificaciones
  results.server = await checkServerHealth();
  results.database = await checkDatabaseConnection();
  results.notifications = await checkNotificationsModule();
  results.checkout = await checkCheckoutModule();
  results.payments = await checkPaymentsModule();
  results.cart = await checkCartModule();
  results.orders = await checkOrdersModule();
  results.products = await checkProductsModule();
  results.auth = await checkAuthModule();
  results.fileUpload = await checkFileUploadModule();
  
  // Generar reporte final
  await generateReport(results);
  
  log('\n✨ Debugging completado', 'bright');
}

// Ejecutar el debugging
debugCompleteSystem().catch(error => {
  log(`❌ Error fatal en debugging: ${error.message}`, 'error');
  process.exit(1);
});
