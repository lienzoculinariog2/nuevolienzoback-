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

async function checkServerStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/products`);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkDataInconsistencies() {
  logSection('VERIFICACIÓN DE INCONSISTENCIAS EN DATOS');
  
  const inconsistencies = [];
  
  try {
    // 1. Verificar productos sin stock pero en carritos
    logStep('1', 'Verificando productos sin stock en carritos...', 'info');
    
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    const products = productsResponse.data;
    
    const productsWithoutStock = products.filter(p => p.stock === 0);
    logStep('1.1', `Productos sin stock encontrados: ${productsWithoutStock.length}`, 'info');
    
    if (productsWithoutStock.length > 0) {
      const cartsResponse = await axios.get(`${BASE_URL}/cart/active`);
      const carts = cartsResponse.data;
      
      let cartsWithOutOfStockItems = 0;
      for (const cart of carts) {
        if (cart.items && cart.items.length > 0) {
          const hasOutOfStockItems = cart.items.some(item => 
            productsWithoutStock.some(p => p.id === item.product?.id)
          );
          if (hasOutOfStockItems) {
            cartsWithOutOfStockItems++;
          }
        }
      }
      
      if (cartsWithOutOfStockItems > 0) {
        logStep('1.2', `Carritos con productos sin stock: ${cartsWithOutOfStockItems}`, 'warning');
        inconsistencies.push(`Carritos con productos sin stock: ${cartsWithOutOfStockItems}`);
      } else {
        logStep('1.2', 'No hay carritos con productos sin stock', 'success');
      }
    }
    
    // 2. Verificar órdenes con estados inconsistentes
    logStep('2', 'Verificando estados inconsistentes en órdenes...', 'info');
    
    const ordersResponse = await axios.get(`${BASE_URL}/orders`);
    const orders = ordersResponse.data;
    
    const inconsistentOrders = orders.filter(order => {
      // Órdenes pagadas pero sin detalles
      if (order.status === 'paid' && (!order.orderDetails || order.orderDetails.length === 0)) {
        return true;
      }
      // Órdenes con total 0 pero pagadas
      if (order.status === 'paid' && order.totalAmount === 0) {
        return true;
      }
      // Órdenes canceladas pero con total mayor a 0
      if (order.status === 'cancelled' && order.totalAmount > 0) {
        return true;
      }
      return false;
    });
    
    if (inconsistentOrders.length > 0) {
      logStep('2.1', `Órdenes con estados inconsistentes: ${inconsistentOrders.length}`, 'warning');
      inconsistencies.push(`Órdenes con estados inconsistentes: ${inconsistentOrders.length}`);
      
      inconsistentOrders.forEach(order => {
        logStep(`2.1.${order.id}`, `Orden ${order.id}: ${order.status} - $${order.totalAmount}`, 'warning');
      });
    } else {
      logStep('2.1', 'No hay órdenes con estados inconsistentes', 'success');
    }
    
    // 3. Verificar carritos con items inválidos
    logStep('3', 'Verificando carritos con items inválidos...', 'info');
    
    const cartsResponse = await axios.get(`${BASE_URL}/cart/active`);
    const carts = cartsResponse.data;
    
    let cartsWithInvalidItems = 0;
    for (const cart of carts) {
      if (cart.items && cart.items.length > 0) {
        const invalidItems = cart.items.filter(item => 
          !item.product || !item.product.id || item.quantity <= 0
        );
        if (invalidItems.length > 0) {
          cartsWithInvalidItems++;
        }
      }
    }
    
    if (cartsWithInvalidItems > 0) {
      logStep('3.1', `Carritos con items inválidos: ${cartsWithInvalidItems}`, 'warning');
      inconsistencies.push(`Carritos con items inválidos: ${cartsWithInvalidItems}`);
    } else {
      logStep('3.1', 'No hay carritos con items inválidos', 'success');
    }
    
    // 4. Verificar códigos de descuento duplicados
    logStep('4', 'Verificando códigos de descuento duplicados...', 'info');
    
    const discountResponse = await axios.get(`${BASE_URL}/discount-codes`);
    const discounts = discountResponse.data;
    
    const discountCodes = discounts.map(d => d.code);
    const duplicateCodes = discountCodes.filter((code, index) => discountCodes.indexOf(code) !== index);
    
    if (duplicateCodes.length > 0) {
      logStep('4.1', `Códigos de descuento duplicados: ${duplicateCodes.length}`, 'warning');
      inconsistencies.push(`Códigos de descuento duplicados: ${duplicateCodes.length}`);
      
      duplicateCodes.forEach(code => {
        logStep(`4.1.${code}`, `Código duplicado: ${code}`, 'warning');
      });
    } else {
      logStep('4.1', 'No hay códigos de descuento duplicados', 'success');
    }
    
    // 5. Verificar pagos sin órdenes asociadas
    logStep('5', 'Verificando pagos sin órdenes asociadas...', 'info');
    
    const paymentsResponse = await axios.get(`${BASE_URL}/payments`);
    const payments = paymentsResponse.data;
    
    const paymentsWithoutOrders = payments.filter(payment => !payment.order || !payment.order.id);
    
    if (paymentsWithoutOrders.length > 0) {
      logStep('5.1', `Pagos sin órdenes asociadas: ${paymentsWithoutOrders.length}`, 'warning');
      inconsistencies.push(`Pagos sin órdenes asociadas: ${paymentsWithoutOrders.length}`);
    } else {
      logStep('5.1', 'No hay pagos sin órdenes asociadas', 'success');
    }
    
    // 6. Verificar usuarios sin carritos
    logStep('6', 'Verificando usuarios sin carritos...', 'info');
    
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const users = usersResponse.data;
    
    const usersWithoutCarts = users.filter(user => {
      return !carts.some(cart => cart.user && cart.user.id === user.id);
    });
    
    if (usersWithoutCarts.length > 0) {
      logStep('6.1', `Usuarios sin carritos: ${usersWithoutCarts.length}`, 'info');
      // Esto no es necesariamente una inconsistencia, solo información
    } else {
      logStep('6.1', 'Todos los usuarios tienen carritos', 'success');
    }
    
  } catch (error) {
    logStep('ERROR', `Error verificando inconsistencias: ${error.message}`, 'error');
    inconsistencies.push(`Error en verificación: ${error.message}`);
  }
  
  return inconsistencies;
}

async function checkCodeInconsistencies() {
  logSection('VERIFICACIÓN DE INCONSISTENCIAS EN CÓDIGO');
  
  const inconsistencies = [];
  
  try {
    // 1. Verificar imports faltantes en módulos
    logStep('1', 'Verificando imports en módulos problemáticos...', 'info');
    
    const modules = ['notifications', 'checkout', 'payments'];
    
    for (const module of modules) {
      const modulePath = path.join(__dirname, 'src/modules', module);
      const moduleFiles = fs.readdirSync(modulePath);
      
      // Verificar archivos principales
      const mainFiles = [`${module}.module.ts`, `${module}.service.ts`];
      
      for (const file of mainFiles) {
        if (moduleFiles.includes(file)) {
          const filePath = path.join(modulePath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Verificar imports básicos
          if (!content.includes('@nestjs/common')) {
            logStep(`1.${module}.${file}`, `Falta import de @nestjs/common en ${file}`, 'warning');
            inconsistencies.push(`Falta import de @nestjs/common en ${module}/${file}`);
          }
          
          if (file.includes('.service.ts') && !content.includes('@Injectable()')) {
            logStep(`1.${module}.${file}`, `Falta decorador @Injectable() en ${file}`, 'warning');
            inconsistencies.push(`Falta decorador @Injectable() en ${module}/${file}`);
          }
        }
      }
    }
    
    // 2. Verificar configuración de TypeORM
    logStep('2', 'Verificando configuración de TypeORM...', 'info');
    
    const typeormPath = path.join(__dirname, 'src/config/typeorm.ts');
    if (fs.existsSync(typeormPath)) {
      const content = fs.readFileSync(typeormPath, 'utf8');
      
      if (!content.includes('synchronize:')) {
        logStep('2.1', 'Falta configuración de synchronize en TypeORM', 'warning');
        inconsistencies.push('Falta configuración de synchronize en TypeORM');
      }
      
      if (!content.includes('entities:')) {
        logStep('2.2', 'Falta configuración de entities en TypeORM', 'warning');
        inconsistencies.push('Falta configuración de entities en TypeORM');
      }
    }
    
    // 3. Verificar variables de entorno
    logStep('3', 'Verificando variables de entorno...', 'info');
    
    const envPath = path.join(__dirname, '.env.development');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      const requiredVars = [
        'DB_HOST', 'DB_NAME', 'DB_USERNAME', 'DB_PASSWORD',
        'JWT_SECRET', 'STRIPE_SECRET_KEY'
      ];
      
      for (const varName of requiredVars) {
        if (!content.includes(varName + '=')) {
          logStep(`3.${varName}`, `Variable ${varName} no encontrada`, 'warning');
          inconsistencies.push(`Variable de entorno ${varName} no encontrada`);
        }
      }
    } else {
      logStep('3', 'Archivo .env.development no encontrado', 'error');
      inconsistencies.push('Archivo .env.development no encontrado');
    }
    
  } catch (error) {
    logStep('ERROR', `Error verificando inconsistencias de código: ${error.message}`, 'error');
    inconsistencies.push(`Error en verificación de código: ${error.message}`);
  }
  
  return inconsistencies;
}

async function checkBusinessLogicInconsistencies() {
  logSection('VERIFICACIÓN DE INCONSISTENCIAS EN LÓGICA DE NEGOCIO');
  
  const inconsistencies = [];
  
  try {
    // 1. Verificar precios negativos
    logStep('1', 'Verificando precios negativos...', 'info');
    
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    const products = productsResponse.data;
    
    const productsWithNegativePrices = products.filter(p => p.price < 0);
    
    if (productsWithNegativePrices.length > 0) {
      logStep('1.1', `Productos con precios negativos: ${productsWithNegativePrices.length}`, 'warning');
      inconsistencies.push(`Productos con precios negativos: ${productsWithNegativePrices.length}`);
    } else {
      logStep('1.1', 'No hay productos con precios negativos', 'success');
    }
    
    // 2. Verificar descuentos mayores al 100%
    logStep('2', 'Verificando descuentos inválidos...', 'info');
    
    const discountResponse = await axios.get(`${BASE_URL}/discount-codes`);
    const discounts = discountResponse.data;
    
    const invalidDiscounts = discounts.filter(d => d.percentage > 100 || d.percentage < 0);
    
    if (invalidDiscounts.length > 0) {
      logStep('2.1', `Códigos de descuento con porcentajes inválidos: ${invalidDiscounts.length}`, 'warning');
      inconsistencies.push(`Códigos de descuento con porcentajes inválidos: ${invalidDiscounts.length}`);
    } else {
      logStep('2.1', 'No hay códigos de descuento con porcentajes inválidos', 'success');
    }
    
    // 3. Verificar cantidades negativas en carritos
    logStep('3', 'Verificando cantidades negativas en carritos...', 'info');
    
    const cartsResponse = await axios.get(`${BASE_URL}/cart/active`);
    const carts = cartsResponse.data;
    
    let cartsWithNegativeQuantities = 0;
    for (const cart of carts) {
      if (cart.items && cart.items.length > 0) {
        const hasNegativeQuantity = cart.items.some(item => item.quantity <= 0);
        if (hasNegativeQuantity) {
          cartsWithNegativeQuantities++;
        }
      }
    }
    
    if (cartsWithNegativeQuantities > 0) {
      logStep('3.1', `Carritos con cantidades negativas: ${cartsWithNegativeQuantities}`, 'warning');
      inconsistencies.push(`Carritos con cantidades negativas: ${cartsWithNegativeQuantities}`);
    } else {
      logStep('3.1', 'No hay carritos con cantidades negativas', 'success');
    }
    
  } catch (error) {
    logStep('ERROR', `Error verificando lógica de negocio: ${error.message}`, 'error');
    inconsistencies.push(`Error en verificación de lógica de negocio: ${error.message}`);
  }
  
  return inconsistencies;
}

async function generateInconsistenciesReport(allInconsistencies) {
  logSection('REPORTE DE INCONSISTENCIAS');
  
  const totalInconsistencies = allInconsistencies.length;
  
  if (totalInconsistencies === 0) {
    log('🎉 ¡NO SE ENCONTRARON INCONSISTENCIAS!', 'green');
    log('El sistema está funcionando de manera consistente.', 'green');
  } else {
    log(`⚠️ Se encontraron ${totalInconsistencies} inconsistencias:`, 'yellow');
    
    allInconsistencies.forEach((inconsistency, index) => {
      log(`   ${index + 1}. ${inconsistency}`, 'red');
    });
    
    log('\n🔧 RECOMENDACIONES PARA SOLUCIONAR INCONSISTENCIAS:', 'cyan');
    
    if (allInconsistencies.some(i => i.includes('carritos'))) {
      log('   - Ejecuta limpieza de carritos: npm run clean-tables', 'yellow');
    }
    
    if (allInconsistencies.some(i => i.includes('órdenes'))) {
      log('   - Revisa y corrige los estados de las órdenes manualmente', 'yellow');
    }
    
    if (allInconsistencies.some(i => i.includes('códigos de descuento'))) {
      log('   - Elimina códigos de descuento duplicados', 'yellow');
    }
    
    if (allInconsistencies.some(i => i.includes('precios negativos'))) {
      log('   - Corrige los precios negativos en productos', 'yellow');
    }
    
    if (allInconsistencies.some(i => i.includes('variables de entorno'))) {
      log('   - Completa las variables de entorno faltantes en .env.development', 'yellow');
    }
  }
  
  log('\n📊 RESUMEN:', 'cyan');
  log(`Total de inconsistencias encontradas: ${totalInconsistencies}`, totalInconsistencies > 0 ? 'error' : 'success');
  log(`Estado: ${totalInconsistencies === 0 ? '✅ CONSISTENTE' : '❌ INCONSISTENTE'}`, totalInconsistencies === 0 ? 'green' : 'red');
}

async function debugInconsistencies() {
  console.clear();
  log('🔍 ===== DEBUGGING DE INCONSISTENCIAS DEL SISTEMA =====', 'bright');
  log(`📅 Timestamp: ${new Date().toISOString()}`, 'info');
  log(`🌐 Base URL: ${BASE_URL}`, 'info');
  log('', 'white');
  
  // Verificar si el servidor está ejecutándose
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    log('❌ El servidor no está ejecutándose. Algunas verificaciones no se pueden realizar.', 'error');
    log('Por favor, inicia el servidor con: npm run start:dev', 'yellow');
    return;
  }
  
  const allInconsistencies = [];
  
  // Ejecutar todas las verificaciones de inconsistencias
  allInconsistencies.push(...(await checkDataInconsistencies()));
  allInconsistencies.push(...(await checkCodeInconsistencies()));
  allInconsistencies.push(...(await checkBusinessLogicInconsistencies()));
  
  // Generar reporte final
  await generateInconsistenciesReport(allInconsistencies);
  
  log('\n✨ Verificación de inconsistencias completada', 'bright');
}

// Ejecutar el debugging
debugInconsistencies().catch(error => {
  log(`❌ Error fatal en debugging de inconsistencias: ${error.message}`, 'error');
  process.exit(1);
});
