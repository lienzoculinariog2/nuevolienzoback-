/* eslint-disable @typescript-eslint/unbound-method */
import { CategoriesController } from '../../categories/categories.controller';
import { DiscountCodesController } from '../../discount-codes/discount-codes.controller';
import { FileUploadController } from '../../file-upload/file-upload.controller';
import { IngredientsController } from '../../ingredients/ingredients.controller';
import { ProductsController } from '../../products/products.controller';
import { Roles } from '../../users/entities/user.entity';

const rolesFor = (handler: (...args: never[]) => unknown): Roles[] | undefined => {
  const metadata: unknown = Reflect.getMetadata('roles', handler);
  return metadata as Roles[] | undefined;
};

describe('Admin catalog authorization metadata', () => {
  it.each([
    ProductsController.prototype.create,
    ProductsController.prototype.update,
    ProductsController.prototype.inactivate,
    ProductsController.prototype.activate,
    CategoriesController.prototype.create,
    CategoriesController.prototype.update,
    CategoriesController.prototype.inactivate,
    CategoriesController.prototype.activate,
    IngredientsController.prototype.create,
    IngredientsController.prototype.update,
    DiscountCodesController.prototype.createDiscountCode,
    DiscountCodesController.prototype.findAll,
    DiscountCodesController.prototype.update,
    DiscountCodesController.prototype.inactivate,
    DiscountCodesController.prototype.activate,
    FileUploadController.prototype.uploadImage,
  ])('requires the admin role for %p', (handler) => {
    expect(rolesFor(handler)).toEqual([Roles.ADMIN]);
  });

  it.each([
    ProductsController.prototype.findAll,
    ProductsController.prototype.getById,
    CategoriesController.prototype.findAll,
    CategoriesController.prototype.findOne,
    IngredientsController.prototype.findAll,
    IngredientsController.prototype.findOne,
    DiscountCodesController.prototype.findOne,
  ])('keeps the public catalog handler %p free of role requirements', (handler) => {
    expect(rolesFor(handler)).toBeUndefined();
  });
});
