import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CartController } from '../../cart/cart.controller';
import { CartService } from '../../cart/cart.service';
import { DiscountCodesController } from '../../discount-codes/discount-codes.controller';
import { DiscountCodesService } from '../../discount-codes/discount-codes.service';
import { OrdersController } from '../../orders/orders.controller';
import { OrdersService } from '../../orders/orders.service';
import { ProductsController } from '../../products/products.controller';
import { ProductsService } from '../../products/products.service';
import { JwtAuthGuard } from '../guard/jwt-auth.guard';
import { RolesGuard } from '../guard/roles.guard';
import { UserOwnershipGuard } from '../guard/user-ownership.guard';

describe('Frontend API contracts', () => {
  let app: INestApplication;

  const product = {
    id: '1ea0fe17-c0c0-4e3f-b91f-3677a51b5a6e',
    name: 'Pizza Margarita',
    price: 12.99,
    stock: 20,
    isActive: true,
  };

  const cartSummary = {
    items: [
      {
        id: '35884120-8f07-44e9-b607-491417c1fbdf',
        name: product.name,
        price: product.price,
        quantity: 2,
        totalItemPrice: 25.98,
      },
    ],
    totalItems: 2,
    subTotal: 25.98,
  };

  const order = {
    id: '65329af1-70d7-46fc-aad8-44af789d57e8',
    status: 'pending',
    total: 25.98,
  };

  const productsService = {
    findAll: jest.fn().mockResolvedValue({
      data: [product],
      totalItems: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
    }),
  };

  const cartService = {
    getCart: jest.fn().mockResolvedValue(cartSummary),
    addSingleProductToCart: jest.fn().mockResolvedValue(cartSummary),
    updateCartItems: jest.fn().mockResolvedValue(cartSummary),
  };

  const ordersService = {
    getUserOrders: jest.fn().mockResolvedValue([order]),
  };

  const discountCodesService = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController, CartController, OrdersController, DiscountCodesController],
      providers: [
        { provide: ProductsService, useValue: productsService },
        { provide: CartService, useValue: cartService },
        { provide: OrdersService, useValue: ordersService },
        { provide: DiscountCodesService, useValue: discountCodesService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(UserOwnershipGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('preserves the products collection response used by the frontend', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?page=1&limit=10')
      .expect(200);

    expect(response.body).toEqual({
      data: [product],
      totalItems: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
    });
    expect(productsService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it('preserves false when filtering inactive products', async () => {
    await request(app.getHttpServer()).get('/products?isActive=false').expect(200);

    expect(productsService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('preserves false when filtering inactive discount codes', async () => {
    await request(app.getHttpServer()).get('/discount-codes?isActive=false').expect(200);

    expect(discountCodesService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });

  it('preserves the user cart response used by the frontend', async () => {
    const response = await request(app.getHttpServer()).get('/cart/auth0-user-id').expect(200);

    expect(response.body).toEqual(cartSummary);
    expect(cartService.getCart).toHaveBeenCalledWith('auth0-user-id');
  });

  it('accepts the existing add-to-cart request contract', async () => {
    const payload = { productId: product.id, quantity: 2 };

    const response = await request(app.getHttpServer())
      .post('/cart/addsingle/auth0-user-id')
      .send(payload)
      .expect(201);

    expect(response.body).toEqual(cartSummary);
    expect(cartService.addSingleProductToCart).toHaveBeenCalledWith('auth0-user-id', payload);
  });

  it.each([
    { productId: 'not-a-uuid', quantity: 2 },
    { productId: product.id, quantity: 0 },
    { productId: product.id, quantity: 1.5 },
  ])('rejects an invalid add-to-cart payload: %p', async (payload) => {
    await request(app.getHttpServer())
      .post('/cart/addsingle/auth0-user-id')
      .send(payload)
      .expect(400);
  });

  it('keeps quantity zero valid when the frontend removes an item through cart update', async () => {
    const payload = {
      updates: [{ itemId: cartSummary.items[0].id, quantity: 0 }],
    };

    await request(app.getHttpServer()).put('/cart/auth0-user-id').send(payload).expect(200);

    expect(cartService.updateCartItems).toHaveBeenCalledWith('auth0-user-id', payload);
  });

  it('preserves the user orders response used by the frontend', async () => {
    const response = await request(app.getHttpServer())
      .get('/orders/user/auth0-user-id')
      .expect(200);

    expect(response.body).toEqual([order]);
    expect(ordersService.getUserOrders).toHaveBeenCalledWith('auth0-user-id');
  });
});
