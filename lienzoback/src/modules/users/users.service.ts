import { HttpException, Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users, Roles, Diet } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {}

  async findAll(): Promise<Users[]> {
    return this.userRepository.find();
  }

  async create(createUserDto: CreateUserDto): Promise<Users> {
    const existingUser = await this.userRepository.findOne({
      where: { id: createUserDto.id },
    });

    if (existingUser) {
      return existingUser;
    }

    const newUser = this.userRepository.create(createUserDto);

    newUser.name = createUserDto.email.split('@')[0];
    newUser.address = '';
    newUser.phone = 0;
    newUser.birthday = new Date();
    newUser.diet = Diet.GENERAL;
    newUser.roles = Roles.CUSTOMER;
    newUser.isSuscribed = false;

    await this.userRepository.save(newUser);
    return newUser;
  }

  async findOneById(id: string): Promise<Users> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<Users> {
    const user = await this.userRepository.preload({
      id: id,
      ...updateUserDto,
    });

    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    await this.userRepository.save(user);
    return user;
  }
}
