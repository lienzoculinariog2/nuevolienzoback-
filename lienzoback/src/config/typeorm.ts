import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

// Solo cargar .env en desarrollo
if (process.env.NODE_ENV !== 'production') {
  dotenvConfig({ path: '.env.development' });
}

// Configuración para Render (producción) vs desarrollo local
const isProduction = process.env.NODE_ENV === 'production';

// Logs para debugging
console.log('🔍 TypeORM Config Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isProduction:', isProduction);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('TYPEORM_SYNC:', process.env.TYPEORM_SYNC);
console.log('TYPEORM_DROP:', process.env.TYPEORM_DROP);
console.log('Final synchronize value:', process.env.TYPEORM_SYNC === 'true');
console.log('Final dropSchema value:', process.env.TYPEORM_DROP === 'true');
if (isProduction) {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'CONFIGURADO' : 'NO CONFIGURADO');
} else {
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'CONFIGURADO' : 'NO CONFIGURADO');
}

const config = {
  type: 'postgres',
  // En producción usar DATABASE_URL, en desarrollo usar variables individuales
  url: isProduction ? process.env.DATABASE_URL : undefined,
  database: isProduction ? undefined : process.env.DB_NAME,
  host: isProduction ? undefined : process.env.DB_HOST,
  port: isProduction ? undefined : process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: isProduction ? undefined : process.env.DB_USERNAME,
  password: isProduction ? undefined : process.env.DB_PASSWORD,
  // ✅ SEGURO: Usar variable de entorno para controlar sincronización
  // En desarrollo: true (facilita setup), En producción: false (seguridad)
  synchronize: process.env.TYPEORM_SYNC === 'true',
  logging: !isProduction, // Solo logging en desarrollo
  dropSchema: process.env.TYPEORM_DROP === 'true',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  // Configuración SSL para Render
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Configuración para manejar dependencias
  extra: {
    // Forzar CASCADE en operaciones de drop
    statement_timeout: 60000,
  },
};

export default registerAs('typeorm', () => config);

export const connectionSource = new DataSource(config as DataSourceOptions);
