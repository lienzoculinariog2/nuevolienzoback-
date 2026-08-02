import { CategoriesService } from '../modules/categories/categories.service';
import { IngredientsService } from '../modules/ingredients/ingredients.service';
import { MigrationService } from '../modules/common/services/migration.service';
import { ProductsService } from '../modules/products/products.service';
import { DatabaseBootstrapService } from './database-bootstrap.service';

describe('DatabaseBootstrapService', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  const categoriesService = {
    seedCategories: jest.fn(),
  };
  const ingredientsService = {
    seedIngredients: jest.fn(),
  };
  const productsService = {
    isPopulated: jest.fn(),
    seedProducts: jest.fn(),
  };
  const migrationService = {
    runMigrations: jest.fn(),
  };

  let service: DatabaseBootstrapService;

  beforeEach(() => {
    jest.clearAllMocks();
    productsService.isPopulated.mockResolvedValue(false);
    categoriesService.seedCategories.mockResolvedValue(undefined);
    ingredientsService.seedIngredients.mockResolvedValue(undefined);
    productsService.seedProducts.mockResolvedValue(undefined);
    migrationService.runMigrations.mockResolvedValue(undefined);

    service = new DatabaseBootstrapService(
      categoriesService as unknown as CategoriesService,
      productsService as unknown as ProductsService,
      ingredientsService as unknown as IngredientsService,
      migrationService as unknown as MigrationService,
    );
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('runs migrations before checking seed data in production', async () => {
    process.env.NODE_ENV = 'production';
    const callOrder: string[] = [];
    migrationService.runMigrations.mockImplementation(async () => {
      callOrder.push('migrations');
    });
    productsService.isPopulated.mockImplementation(async () => {
      callOrder.push('population-check');
      return true;
    });

    await service.onModuleInit();

    expect(callOrder).toEqual(['migrations', 'population-check']);
    expect(categoriesService.seedCategories).not.toHaveBeenCalled();
    expect(ingredientsService.seedIngredients).not.toHaveBeenCalled();
    expect(productsService.seedProducts).not.toHaveBeenCalled();
  });

  it('skips migrations in development and seeds data in dependency order', async () => {
    process.env.NODE_ENV = 'development';
    const callOrder: string[] = [];
    categoriesService.seedCategories.mockImplementation(async () => {
      callOrder.push('categories');
    });
    ingredientsService.seedIngredients.mockImplementation(async () => {
      callOrder.push('ingredients');
    });
    productsService.seedProducts.mockImplementation(async () => {
      callOrder.push('products');
    });

    await service.onModuleInit();

    expect(migrationService.runMigrations).not.toHaveBeenCalled();
    expect(callOrder).toEqual(['categories', 'ingredients', 'products']);
  });

  it('continues seeding when the population check fails', async () => {
    process.env.NODE_ENV = 'development';
    productsService.isPopulated.mockRejectedValue(new Error('database unavailable'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    expect(categoriesService.seedCategories).toHaveBeenCalledTimes(1);
    expect(ingredientsService.seedIngredients).toHaveBeenCalledTimes(1);
    expect(productsService.seedProducts).toHaveBeenCalledTimes(1);
  });

  it('keeps startup alive when a seeder fails', async () => {
    process.env.NODE_ENV = 'development';
    categoriesService.seedCategories.mockRejectedValue(new Error('seed failed'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    expect(ingredientsService.seedIngredients).not.toHaveBeenCalled();
    expect(productsService.seedProducts).not.toHaveBeenCalled();
  });
});
