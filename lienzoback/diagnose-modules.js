const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnóstico de Módulos - Payments, Checkout y Orders');
console.log('=====================================================\n');

// Verificar estructura de archivos
const modules = ['payments', 'checkout', 'orders'];
const requiredFiles = {
  payments: [
    'src/modules/payments/payments.module.ts',
    'src/modules/payments/payments.controller.ts',
    'src/modules/payments/payments.service.ts',
    'src/modules/payments/entities/payment.entity.ts',
    'src/modules/payments/services/payment-management.service.ts',
    'src/modules/payments/services/payment-calculation.service.ts'
  ],
  checkout: [
    'src/modules/checkout/checkout.module.ts',
    'src/modules/checkout/checkout.controller.ts',
    'src/modules/checkout/checkout.service.ts',
    'src/modules/checkout/services/checkout-integration.service.ts'
  ],
  orders: [
    'src/modules/orders/orders.module.ts',
    'src/modules/orders/orders.controller.ts',
    'src/modules/orders/orders.service.ts',
    'src/modules/orders/entities/order.entity.ts'
  ]
};

console.log('📁 Verificando estructura de archivos...');
for (const module of modules) {
  console.log(`\n🔍 Módulo: ${module.toUpperCase()}`);
  for (const file of requiredFiles[module]) {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  }
}

// Verificar variables de entorno
console.log('\n🔧 Verificando variables de entorno...');
try {
  const envContent = fs.readFileSync('.env.development', 'utf8');
  const envVars = {
    'STRIPE_SECRET_KEY': envContent.includes('STRIPE_SECRET_KEY'),
    'STRIPE_PUBLISHABLE_KEY': envContent.includes('STRIPE_PUBLISHABLE_KEY'),
    'STRIPE_WEBHOOK_SECRET': envContent.includes('STRIPE_WEBHOOK_SECRET'),
    'DATABASE_URL': envContent.includes('DATABASE_URL'),
    'DB_HOST': envContent.includes('DB_HOST'),
    'DB_NAME': envContent.includes('DB_NAME')
  };
  
  for (const [varName, exists] of Object.entries(envVars)) {
    console.log(`  ${exists ? '✅' : '❌'} ${varName}`);
  }
} catch (error) {
  console.log('  ❌ No se pudo leer .env.development');
}

// Verificar migraciones
console.log('\n🗄️ Verificando migraciones...');
const migrationsDir = 'src/migrations';
if (fs.existsSync(migrationsDir)) {
  const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));
  console.log(`  ✅ Encontradas ${migrations.length} migraciones:`);
  migrations.forEach(migration => {
    console.log(`    - ${migration}`);
  });
} else {
  console.log('  ❌ Directorio de migraciones no encontrado');
}

// Verificar app.module.ts
console.log('\n📦 Verificando app.module.ts...');
try {
  const appModuleContent = fs.readFileSync('src/app.module.ts', 'utf8');
  const modulesInApp = {
    'PaymentsModule': appModuleContent.includes('PaymentsModule'),
    'CheckoutModule': appModuleContent.includes('CheckoutModule'),
    'OrdersModule': appModuleContent.includes('OrdersModule')
  };
  
  for (const [moduleName, exists] of Object.entries(modulesInApp)) {
    console.log(`  ${exists ? '✅' : '❌'} ${moduleName} importado`);
  }
} catch (error) {
  console.log('  ❌ No se pudo leer app.module.ts');
}

console.log('\n🎯 Diagnóstico completado. Revisa los resultados arriba.');
