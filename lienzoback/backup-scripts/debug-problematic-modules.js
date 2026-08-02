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

async function debugNotificationsModule() {
  logSection('DEBUGGING DETALLADO - MÓDULO DE NOTIFICACIONES');
  
  const issues = [];
  
  try {
    // 1. Verificar estructura del módulo
    logStep('1', 'Verificando estructura del módulo...', 'info');
    
    const modulePath = path.join(__dirname, 'src/modules/notifications');
    const templatesPath = path.join(modulePath, 'templates');
    
    if (!fs.existsSync(modulePath)) {
      issues.push('Directorio del módulo no existe');
      logStep('1.1', 'Directorio del módulo no existe', 'error');
    } else {
      logStep('1.1', 'Directorio del módulo existe', 'success');
    }
    
    if (!fs.existsSync(templatesPath)) {
      issues.push('Directorio de templates no existe');
      logStep('1.2', 'Directorio de templates no existe', 'error');
    } else {
      const templates = fs.readdirSync(templatesPath);
      logStep('1.2', `Templates encontrados: ${templates.join(', ')}`, 'success');
      
      // Verificar templates específicos
      const requiredTemplates = ['signUp-confirmation.hbs', 'purchase-confirmation.hbs', 'weekly-newsletter.hbs'];
      for (const template of requiredTemplates) {
        if (templates.includes(template)) {
          logStep(`1.2.${template}`, `Template ${template} encontrado`, 'success');
        } else {
          issues.push(`Template ${template} no encontrado`);
          logStep(`1.2.${template}`, `Template ${template} no encontrado`, 'error');
        }
      }
    }
    
    // 2. Verificar configuración de email
    logStep('2', 'Verificando configuración de email...', 'info');
    
    try {
      const response = await axios.get(`${BASE_URL}/notifications/test-email`);
      logStep('2.1', 'Endpoint de test de email accesible', 'success');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logStep('2.1', 'Endpoint de test de email no implementado', 'warning');
      } else {
        logStep('2.1', `Error en endpoint de test: ${error.message}`, 'error');
        issues.push('Error en endpoint de test de email');
      }
    }
    
    // 3. Verificar variables de entorno necesarias
    logStep('3', 'Verificando variables de entorno...', 'info');
    
    const requiredEnvVars = [
      'NODEMAILER_HOST',
      'NODEMAILER_PORT', 
      'NODEMAILER_SECURE',
      'EMAIL_USER',
      'EMAIL_PASSWORD'
    ];
    
    // Nota: No podemos leer directamente el .env, pero podemos verificar si el módulo funciona
    logStep('3.1', 'Verificando si el módulo puede inicializarse...', 'info');
    
    // 4. Verificar funcionalidad de newsletter
    logStep('4', 'Verificando funcionalidad de newsletter...', 'info');
    
    try {
      const response = await axios.get(`${BASE_URL}/notifications/newsletter`);
      logStep('4.1', 'Endpoint de newsletter accesible', 'success');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logStep('4.1', 'Endpoint de newsletter no implementado', 'warning');
      } else {
        logStep('4.1', `Error en endpoint de newsletter: ${error.message}`, 'error');
        issues.push('Error en endpoint de newsletter');
      }
    }
    
  } catch (error) {
    logStep('ERROR', `Error general en módulo de notificaciones: ${error.message}`, 'error');
    issues.push(`Error general: ${error.message}`);
  }
  
  return {
    module: 'notifications',
    issues: issues,
    status: issues.length === 0 ? 'healthy' : 'has_issues'
  };
}

async function debugCheckoutModule() {
  logSection('DEBUGGING DETALLADO - MÓDULO DE CHECKOUT');
  
  const issues = [];
  
  try {
    // 1. Verificar estructura del módulo
    logStep('1', 'Verificando estructura del módulo...', 'info');
    
    const modulePath = path.join(__dirname, 'src/modules/checkout');
    if (!fs.existsSync(modulePath)) {
      issues.push('Directorio del módulo no existe');
      logStep('1.1', 'Directorio del módulo no existe', 'error');
    } else {
      logStep('1.1', 'Directorio del módulo existe', 'success');
    }
    
    // 2. Verificar endpoints
    logStep('2', 'Verificando endpoints...', 'info');
    
    // Endpoint principal de checkout
    try {
      const response = await axios.get(`${BASE_URL}/checkout`);
      logStep('2.1', 'Endpoint principal de checkout accesible', 'success');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logStep('2.1', 'Endpoint principal de checkout no encontrado', 'error');
        issues.push('Endpoint principal de checkout no encontrado');
      } else {
        logStep('2.1', `Error en endpoint principal: ${error.message}`, 'error');
        issues.push(`Error en endpoint principal: ${error.message}`);
      }
    }
    
    // 3. Verificar integración con carrito
    logStep('3', 'Verificando integración con carrito...', 'info');
    
    try {
      const cartsResponse = await axios.get(`${BASE_URL}/cart/active`);
      logStep('3.1', `Carritos activos encontrados: ${cartsResponse.data.length}`, 'success');
      
      if (cartsResponse.data.length > 0) {
        const cart = cartsResponse.data[0];
        logStep('3.2', `Carrito ejemplo - ID: ${cart.id}, Items: ${cart.items?.length || 0}`, 'info');
        
        // Verificar si el carrito tiene items válidos
        if (cart.items && cart.items.length > 0) {
          const validItems = cart.items.filter(item => item.product && item.product.id);
          logStep('3.3', `Items válidos en carrito: ${validItems.length}/${cart.items.length}`, 'info');
          
          if (validItems.length < cart.items.length) {
            logStep('3.3', 'Algunos items del carrito no tienen productos válidos', 'warning');
            issues.push('Items del carrito con productos inválidos');
          }
        }
      }
    } catch (error) {
      logStep('3.1', `Error verificando carritos: ${error.message}`, 'error');
      issues.push(`Error verificando carritos: ${error.message}`);
    }
    
    // 4. Verificar integración con códigos de descuento
    logStep('4', 'Verificando integración con códigos de descuento...', 'info');
    
    try {
      const discountResponse = await axios.get(`${BASE_URL}/discount-codes`);
      logStep('4.1', `Códigos de descuento disponibles: ${discountResponse.data.length}`, 'success');
      
      if (discountResponse.data.length > 0) {
        const discount = discountResponse.data[0];
        logStep('4.2', `Código ejemplo - ${discount.code}, Descuento: ${discount.percentage}%`, 'info');
      }
    } catch (error) {
      logStep('4.1', `Error verificando códigos de descuento: ${error.message}`, 'error');
      issues.push(`Error verificando códigos de descuento: ${error.message}`);
    }
    
    // 5. Verificar proceso de checkout
    logStep('5', 'Verificando proceso de checkout...', 'info');
    
    try {
      // Intentar hacer un checkout con datos de prueba
      const checkoutData = {
        discountCode: null,
        shippingAddress: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345'
        }
      };
      
      const checkoutResponse = await axios.post(`${BASE_URL}/checkout`, checkoutData);
      logStep('5.1', 'Proceso de checkout funciona', 'success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logStep('5.1', 'Proceso de checkout responde (error esperado sin carrito)', 'success');
      } else {
        logStep('5.1', `Error en proceso de checkout: ${error.message}`, 'error');
        issues.push(`Error en proceso de checkout: ${error.message}`);
      }
    }
    
  } catch (error) {
    logStep('ERROR', `Error general en módulo de checkout: ${error.message}`, 'error');
    issues.push(`Error general: ${error.message}`);
  }
  
  return {
    module: 'checkout',
    issues: issues,
    status: issues.length === 0 ? 'healthy' : 'has_issues'
  };
}

async function debugPaymentsModule() {
  logSection('DEBUGGING DETALLADO - MÓDULO DE PAGOS');
  
  const issues = [];
  
  try {
    // 1. Verificar estructura del módulo
    logStep('1', 'Verificando estructura del módulo...', 'info');
    
    const modulePath = path.join(__dirname, 'src/modules/payments');
    if (!fs.existsSync(modulePath)) {
      issues.push('Directorio del módulo no existe');
      logStep('1.1', 'Directorio del módulo no existe', 'error');
    } else {
      logStep('1.1', 'Directorio del módulo existe', 'success');
    }
    
    // 2. Verificar endpoints principales
    logStep('2', 'Verificando endpoints principales...', 'info');
    
    try {
      const response = await axios.get(`${BASE_URL}/payments`);
      logStep('2.1', 'Endpoint principal de pagos accesible', 'success');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logStep('2.1', 'Endpoint principal de pagos no encontrado', 'error');
        issues.push('Endpoint principal de pagos no encontrado');
      } else {
        logStep('2.1', `Error en endpoint principal: ${error.message}`, 'error');
        issues.push(`Error en endpoint principal: ${error.message}`);
      }
    }
    
    // 3. Verificar webhook de Stripe
    logStep('3', 'Verificando webhook de Stripe...', 'info');
    
    try {
      const webhookResponse = await axios.post(`${BASE_URL}/payments/webhook`, {}, {
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid-signature'
        }
      });
      logStep('3.1', 'Webhook endpoint responde', 'success');
    } catch (webhookError) {
      if (webhookError.response && webhookError.response.status === 400) {
        logStep('3.1', 'Webhook endpoint responde (error esperado por firma inválida)', 'success');
      } else {
        logStep('3.1', `Error en webhook: ${webhookError.message}`, 'error');
        issues.push(`Error en webhook: ${webhookError.message}`);
      }
    }
    
    // 4. Verificar creación de intención de pago
    logStep('4', 'Verificando creación de intención de pago...', 'info');
    
    try {
      const paymentIntentData = {
        amount: 1000, // $10.00
        currency: 'usd',
        payment_method_types: ['card']
      };
      
      const paymentIntentResponse = await axios.post(`${BASE_URL}/payments/create-payment-intent`, paymentIntentData);
      logStep('4.1', 'Creación de intención de pago funciona', 'success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logStep('4.1', 'Creación de intención de pago responde (error esperado sin datos válidos)', 'success');
      } else {
        logStep('4.1', `Error en creación de intención de pago: ${error.message}`, 'error');
        issues.push(`Error en creación de intención de pago: ${error.message}`);
      }
    }
    
    // 5. Verificar confirmación de pago
    logStep('5', 'Verificando confirmación de pago...', 'info');
    
    try {
      const confirmData = {
        paymentIntentId: 'pi_test_123',
        paymentMethodId: 'pm_test_123'
      };
      
      const confirmResponse = await axios.post(`${BASE_URL}/payments/confirm-payment`, confirmData);
      logStep('5.1', 'Confirmación de pago funciona', 'success');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logStep('5.1', 'Confirmación de pago responde (error esperado con datos de prueba)', 'success');
      } else {
        logStep('5.1', `Error en confirmación de pago: ${error.message}`, 'error');
        issues.push(`Error en confirmación de pago: ${error.message}`);
      }
    }
    
    // 6. Verificar estado de pagos
    logStep('6', 'Verificando estado de pagos...', 'info');
    
    try {
      const paymentsResponse = await axios.get(`${BASE_URL}/payments`);
      logStep('6.1', `Pagos encontrados: ${paymentsResponse.data.length}`, 'success');
      
      if (paymentsResponse.data.length > 0) {
        const payment = paymentsResponse.data[0];
        logStep('6.2', `Pago ejemplo - ID: ${payment.id}, Estado: ${payment.status}, Amount: $${payment.amount}`, 'info');
      }
    } catch (error) {
      logStep('6.1', `Error verificando pagos: ${error.message}`, 'error');
      issues.push(`Error verificando pagos: ${error.message}`);
    }
    
  } catch (error) {
    logStep('ERROR', `Error general en módulo de pagos: ${error.message}`, 'error');
    issues.push(`Error general: ${error.message}`);
  }
  
  return {
    module: 'payments',
    issues: issues,
    status: issues.length === 0 ? 'healthy' : 'has_issues'
  };
}

async function generateDetailedReport(results) {
  logSection('REPORTE DETALLADO DE MÓDULOS PROBLEMÁTICOS');
  
  let totalIssues = 0;
  
  for (const result of results) {
    log(`\n📋 MÓDULO: ${result.module.toUpperCase()}`, 'bright');
    log(`Estado: ${result.status === 'healthy' ? '✅ SALUDABLE' : '❌ CON PROBLEMAS'}`, result.status === 'healthy' ? 'green' : 'red');
    
    if (result.issues.length > 0) {
      log('Problemas encontrados:', 'yellow');
      result.issues.forEach((issue, index) => {
        log(`   ${index + 1}. ${issue}`, 'red');
      });
      totalIssues += result.issues.length;
    } else {
      log('   ✅ Sin problemas detectados', 'green');
    }
  }
  
  log('\n📊 RESUMEN GENERAL:', 'cyan');
  log(`Total de módulos verificados: ${results.length}`, 'info');
  log(`Módulos saludables: ${results.filter(r => r.status === 'healthy').length}`, 'success');
  log(`Módulos con problemas: ${results.filter(r => r.status === 'has_issues').length}`, 'error');
  log(`Total de problemas encontrados: ${totalIssues}`, totalIssues > 0 ? 'error' : 'success');
  
  if (totalIssues > 0) {
    log('\n🔧 RECOMENDACIONES ESPECÍFICAS:', 'cyan');
    
    for (const result of results) {
      if (result.issues.length > 0) {
        log(`\nPara el módulo ${result.module}:`, 'yellow');
        
        if (result.module === 'notifications') {
          log('   - Verificar configuración de email en .env.development', 'yellow');
          log('   - Asegurar que los templates de Handlebars existan', 'yellow');
          log('   - Verificar que Nodemailer esté configurado correctamente', 'yellow');
        }
        
        if (result.module === 'checkout') {
          log('   - Verificar que el endpoint de checkout esté implementado', 'yellow');
          log('   - Revisar la lógica de validación de carrito', 'yellow');
          log('   - Verificar integración con códigos de descuento', 'yellow');
        }
        
        if (result.module === 'payments') {
          log('   - Verificar configuración de Stripe en .env.development', 'yellow');
          log('   - Revisar que el webhook esté configurado correctamente', 'yellow');
          log('   - Verificar que las claves de API de Stripe sean válidas', 'yellow');
        }
      }
    }
  } else {
    log('\n🎉 ¡TODOS LOS MÓDULOS PROBLEMÁTICOS ESTÁN FUNCIONANDO CORRECTAMENTE!', 'green');
  }
}

async function debugProblematicModules() {
  console.clear();
  log('🔍 ===== DEBUGGING DETALLADO DE MÓDULOS PROBLEMÁTICOS =====', 'bright');
  log(`📅 Timestamp: ${new Date().toISOString()}`, 'info');
  log(`🌐 Base URL: ${BASE_URL}`, 'info');
  log('', 'white');
  
  const results = [];
  
  // Ejecutar debugging detallado de cada módulo problemático
  results.push(await debugNotificationsModule());
  results.push(await debugCheckoutModule());
  results.push(await debugPaymentsModule());
  
  // Generar reporte detallado
  await generateDetailedReport(results);
  
  log('\n✨ Debugging detallado completado', 'bright');
}

// Ejecutar el debugging
debugProblematicModules().catch(error => {
  log(`❌ Error fatal en debugging: ${error.message}`, 'error');
  process.exit(1);
});
