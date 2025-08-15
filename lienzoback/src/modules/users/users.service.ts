import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { CartService } from '../cart/cart.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly cartService: CartService,
  ) {}

  async create(userData: Partial<Users>): Promise<Users> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    // 1. Crea una instancia del usuario.
    const newUser = this.usersRepository.create(userData);

    // 2. Guarda el usuario para que se le asigne un ID.
    await this.usersRepository.save(newUser);

    // 3. Crea el carrito y lo asocia al usuario recién creado.
    return newUser;
  }
}
