const fs = require('fs');
const path = require('path');

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

function checkFileStructure() {
  logSection('VERIFICACIÓN DE ESTRUCTURA DE ARCHIVOS');
  
  const issues = [];
  const requiredFiles = [
    'package.json',
    'src/main.ts',
    'src/app.module.ts',
    'src/config/typeorm.ts',
    '.env.development'
  ];
  
  const requiredDirectories = [
    'src/modules/notifications',
    'src/modules/checkout',
    'src/modules/payments',
    'src/modules/cart',
    'src/modules/orders',
    'src/modules/products',
    'src/modules/users',
    'src/modules/auth'
  ];
  
  logStep('1', 'Verificando archivos requeridos...', 'info');
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logStep(`1.${file}`, `Archivo ${file} encontrado`, 'success');
    } else {
      logStep(`1.${file}`, `Archivo ${file} no encontrado`, 'error');
      issues.push(`Archivo ${file} no encontrado`);
    }
  }
  
  logStep('2', 'Verificando directorios requeridos...', 'info');
  
  for (const dir of requiredDirectories) {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath)) {
      logStep(`2.${dir}`, `Directorio ${dir} encontrado`, 'success');
    } else {
      logStep(`2.${dir}`, `Directorio ${dir} no encontrado`, 'error');
      issues.push(`Directorio ${dir} no encontrado`);
    }
  }
  
  return issues;
}

function checkPackageJson() {
  logSection('VERIFICACIÓN DE PACKAGE.JSON');
  
  const issues = [];
  
  try {
    const packagePath = path.join(__dirname, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    logStep('1', 'Archivo package.json válido', 'success');
    
    // Verificar scripts importantes
    const requiredScripts = ['start', 'start:dev', 'build', 'test'];
    logStep('2', 'Verificando scripts requeridos...', 'info');
    
    for (const script of requiredScripts) {
      if (packageContent.scripts && packageContent.scripts[script]) {
        logStep(`2.${script}`, `Script ${script} encontrado`, 'success');
      } else {
        logStep(`2.${script}`, `Script ${script} no encontrado`, 'warning');
        issues.push(`Script ${script} no encontrado`);
      }
    }
    
    // Verificar dependencias importantes
    const requiredDependencies = [
      '@nestjs/common',
      '@nestjs/typeorm',
      'typeorm',
      'pg',
      'stripe',
      '@nestjs-modules/mailer',
      'nodemailer'
    ];
    
    logStep('3', 'Verificando dependencias requeridas...', 'info');
    
    for (const dep of requiredDependencies) {
      if (packageContent.dependencies && packageContent.dependencies[dep]) {
        logStep(`3.${dep}`, `Dependencia ${dep} encontrada`, 'success');
      } else {
        logStep(`3.${dep}`, `Dependencia ${dep} no encontrada`, 'error');
        issues.push(`Dependencia ${dep} no encontrada`);
      }
    }
    
  } catch (error) {
    logStep('ERROR', `Error leyendo package.json: ${error.message}`, 'error');
    issues.push(`Error leyendo package.json: ${error.message}`);
  }
  
  return issues;
}

function checkEnvironmentFile() {
  logSection('VERIFICACIÓN DE ARCHIVO DE ENTORNO');
  
  const issues = [];
  
  try {
    const envPath = path.join(__dirname, '.env.development');
    
    if (!fs.existsSync(envPath)) {
      logStep('1', 'Archivo .env.development no encontrado', 'error');
      issues.push('Archivo .env.development no encontrado');
      return issues;
    }
    
    logStep('1', 'Archivo .env.development encontrado', 'success');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    logStep('2', `Variables de entorno encontradas: ${envLines.length}`, 'info');
    
    // Verificar variables críticas
    const criticalVars = [
      'DB_HOST',
      'DB_NAME',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_PORT',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ];
    
    logStep('3', 'Verificando variables críticas...', 'info');
    
    for (const varName of criticalVars) {
      const hasVar = envLines.some(line => line.startsWith(varName + '='));
      if (hasVar) {
        logStep(`3.${varName}`, `Variable ${varName} encontrada`, 'success');
      } else {
        logStep(`3.${varName}`, `Variable ${varName} no encontrada`, 'warning');
        issues.push(`Variable ${varName} no encontrada`);
      }
    }
    
    // Verificar variables de email
    const emailVars = [
      'NODEMAILER_HOST',
      'NODEMAILER_PORT',
      'NODEMAILER_SECURE',
      'EMAIL_USER',
      'EMAIL_PASSWORD'
    ];
    
    logStep('4', 'Verificando variables de email...', 'info');
    
    for (const varName of emailVars) {
      const hasVar = envLines.some(line => line.startsWith(varName + '='));
      if (hasVar) {
        logStep(`4.${varName}`, `Variable ${varName} encontrada`, 'success');
      } else {
        logStep(`4.${varName}`, `Variable ${varName} no encontrada`, 'warning');
        issues.push(`Variable ${varName} no encontrada`);
      }
    }
    
  } catch (error) {
    logStep('ERROR', `Error leyendo archivo de entorno: ${error.message}`, 'error');
    issues.push(`Error leyendo archivo de entorno: ${error.message}`);
  }
  
  return issues;
}

function checkTypeOrmConfig() {
  logSection('VERIFICACIÓN DE CONFIGURACIÓN TYPEORM');
  
  const issues = [];
  
  try {
    const configPath = path.join(__dirname, 'src/config/typeorm.ts');
    
    if (!fs.existsSync(configPath)) {
      logStep('1', 'Archivo de configuración TypeORM no encontrado', 'error');
      issues.push('Archivo de configuración TypeORM no encontrado');
      return issues;
    }
    
    logStep('1', 'Archivo de configuración TypeORM encontrado', 'success');
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Verificar configuraciones importantes
    const requiredConfigs = [
      'type: \'postgres\'',
      'synchronize:',
      'entities:',
      'migrations:'
    ];
    
    logStep('2', 'Verificando configuraciones requeridas...', 'info');
    
    for (const config of requiredConfigs) {
      if (configContent.includes(config)) {
        logStep(`2.${config}`, `Configuración ${config} encontrada`, 'success');
      } else {
        logStep(`2.${config}`, `Configuración ${config} no encontrada`, 'error');
        issues.push(`Configuración ${config} no encontrada`);
      }
    }
    
    // Verificar configuración de SSL para producción
    if (configContent.includes('ssl:') && configContent.includes('rejectUnauthorized: false')) {
      logStep('3', 'Configuración SSL para producción encontrada', 'success');
    } else {
      logStep('3', 'Configuración SSL para producción no encontrada', 'warning');
      issues.push('Configuración SSL para producción no encontrada');
    }
    
  } catch (error) {
    logStep('ERROR', `Error verificando configuración TypeORM: ${error.message}`, 'error');
    issues.push(`Error verificando configuración TypeORM: ${error.message}`);
  }
  
  return issues;
}

function checkModuleStructure() {
  logSection('VERIFICACIÓN DE ESTRUCTURA DE MÓDULOS');
  
  const issues = [];
  
  const modules = [
    'notifications',
    'checkout', 
    'payments',
    'cart',
    'orders',
    'products',
    'users',
    'auth'
  ];
  
  for (const module of modules) {
    const modulePath = path.join(__dirname, 'src/modules', module);
    
    if (!fs.existsSync(modulePath)) {
      logStep(`1.${module}`, `Módulo ${module} no encontrado`, 'error');
      issues.push(`Módulo ${module} no encontrado`);
      continue;
    }
    
    logStep(`1.${module}`, `Módulo ${module} encontrado`, 'success');
    
    // Verificar archivos básicos del módulo
    const moduleFiles = fs.readdirSync(modulePath);
    const requiredFiles = [`${module}.module.ts`, `${module}.service.ts`];
    
    for (const file of requiredFiles) {
      if (moduleFiles.includes(file)) {
        logStep(`2.${module}.${file}`, `Archivo ${file} encontrado en ${module}`, 'success');
      } else {
        logStep(`2.${module}.${file}`, `Archivo ${file} no encontrado en ${module}`, 'error');
        issues.push(`Archivo ${file} no encontrado en módulo ${module}`);
      }
    }
    
    // Verificar si tiene controlador
    const hasController = moduleFiles.some(file => file.includes('.controller.ts'));
    if (hasController) {
      logStep(`3.${module}`, `Controlador encontrado en ${module}`, 'success');
    } else {
      logStep(`3.${module}`, `Controlador no encontrado en ${module}`, 'warning');
      issues.push(`Controlador no encontrado en módulo ${module}`);
    }
  }
  
  return issues;
}

function generateEnvironmentReport(allIssues) {
  logSection('REPORTE DE CONFIGURACIÓN DEL ENTORNO');
  
  const totalIssues = allIssues.length;
  
  if (totalIssues === 0) {
    log('🎉 ¡CONFIGURACIÓN DEL ENTORNO PERFECTA!', 'green');
    log('Todos los archivos, dependencias y configuraciones están correctamente configurados.', 'green');
  } else {
    log(`⚠️ Se encontraron ${totalIssues} problemas en la configuración:`, 'yellow');
    
    allIssues.forEach((issue, index) => {
      log(`   ${index + 1}. ${issue}`, 'red');
    });
    
    log('\n🔧 RECOMENDACIONES PARA SOLUCIONAR PROBLEMAS:', 'cyan');
    
    if (allIssues.some(issue => issue.includes('package.json'))) {
      log('   - Ejecutar npm install para instalar dependencias faltantes', 'yellow');
    }
    
    if (allIssues.some(issue => issue.includes('.env.development'))) {
      log('   - Crear o completar el archivo .env.development con las variables necesarias', 'yellow');
      log('   - Verificar que todas las claves de API estén configuradas', 'yellow');
    }
    
    if (allIssues.some(issue => issue.includes('TypeORM'))) {
      log('   - Revisar la configuración de TypeORM en src/config/typeorm.ts', 'yellow');
    }
    
    if (allIssues.some(issue => issue.includes('módulo'))) {
      log('   - Verificar que todos los módulos estén correctamente implementados', 'yellow');
    }
  }
  
  log('\n📋 RESUMEN:', 'cyan');
  log(`Total de problemas encontrados: ${totalIssues}`, totalIssues > 0 ? 'error' : 'success');
  log(`Estado: ${totalIssues === 0 ? '✅ CONFIGURACIÓN CORRECTA' : '❌ REQUIERE ATENCIÓN'}`, totalIssues === 0 ? 'green' : 'red');
}

async function debugEnvironmentConfig() {
  console.clear();
  log('🔍 ===== DEBUGGING DE CONFIGURACIÓN DEL ENTORNO =====', 'bright');
  log(`📅 Timestamp: ${new Date().toISOString()}`, 'info');
  log(`📁 Directorio: ${__dirname}`, 'info');
  log('', 'white');
  
  const allIssues = [];
  
  // Ejecutar todas las verificaciones
  allIssues.push(...checkFileStructure());
  allIssues.push(...checkPackageJson());
  allIssues.push(...checkEnvironmentFile());
  allIssues.push(...checkTypeOrmConfig());
  allIssues.push(...checkModuleStructure());
  
  // Generar reporte final
  generateEnvironmentReport(allIssues);
  
  log('\n✨ Verificación de entorno completada', 'bright');
}

// Ejecutar el debugging
debugEnvironmentConfig().catch(error => {
  log(`❌ Error fatal en debugging: ${error.message}`, 'error');
  process.exit(1);
});
