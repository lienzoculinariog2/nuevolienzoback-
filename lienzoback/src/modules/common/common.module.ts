import { Module } from '@nestjs/common';
import { MigrationService } from './services/migration.service';

@Module({
  providers: [MigrationService],
  exports: [MigrationService],
})
export class CommonModule {}
