import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CategoriesService } from '../modules/categories/categories.service';
import { IngredientsService } from '../modules/ingredients/ingredients.service';
import { ProductsService } from '../modules/products/products.service';
import { MigrationService } from '../modules/common/services/migration.service';

@Injectable()
export class DatabaseBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly ingredientsService: IngredientsService,
    private readonly migrationService: MigrationService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Iniciando aplicación...');

    if (process.env.NODE_ENV === 'production') {
      this.logger.log('Ejecutando migraciones...');
      await this.migrationService.runMigrations();
    } else {
      this.logger.log('Modo desarrollo: saltando migraciones (synchronize: true)');
    }

    await this.seedDatabaseIfEmpty();
  }

  private async seedDatabaseIfEmpty(): Promise<void> {
    this.logger.log('Ejecutando seeders...');

    try {
      if (await this.productsService.isPopulated()) {
        this.logger.log('Base de datos ya poblada. Saltando seeders.');
        return;
      }
    } catch (error) {
      this.logger.warn(
        `Error verificando si las tablas están pobladas: ${this.getErrorMessage(error)}`,
      );
      this.logger.log('Continuando con la inicialización...');
    }

    try {
      this.logger.log('Sembrando categorías...');
      await this.categoriesService.seedCategories();

      this.logger.log('Sembrando ingredientes...');
      await this.ingredientsService.seedIngredients();

      this.logger.log('Sembrando productos y vinculando relaciones...');
      await this.productsService.seedProducts();

      this.logger.log('Seeders completados exitosamente.');
    } catch (error) {
      this.logger.error(`Error ejecutando seeders: ${this.getErrorMessage(error)}`);
      this.logger.log('Continuando sin seeders...');
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
