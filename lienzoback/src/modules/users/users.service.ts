// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Users } from './entities/user.entity';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

// @Injectable()
// export class UsersService {
//   constructor(
//     @InjectRepository(Users)
//     private usersRepository: Repository<Users>,
//   ) {}

//   async create(createUserDto: CreateUserDto): Promise<Users> {
//     const newUser = this.usersRepository.create(createUserDto);
//     return this.usersRepository.save(newUser);
//   }

//   async update(auth0Id: string, updateUserDto: UpdateUserDto): Promise<Users> {
//     const user = await this.usersRepository.findOne({ where: { auth0Id } });

//     if (!user) {
//       throw new NotFoundException(`User with Auth0 ID "${auth0Id}" not found`);
//     }

//     // Aplica los cambios a la entidad del usuario
//     Object.assign(user, updateUserDto);

//     // Guarda los cambios en la base de datos
//     return this.usersRepository.save(user);
//   }

//   async findOneByAuth0Id(auth0Id: string): Promise<Users> {
//     const user = await this.usersRepository.findOne({ where: { auth0Id } });
//     if (!user) {
//       throw new NotFoundException(`User with Auth0 ID "${auth0Id}" not found`);
//     }
//     return user;
//   }
// }
// src/users/users.service.ts
// src/users/users.service.ts
// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Users> {
    const newUser = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(newUser);
  }

  async update(auth0Id: string, updateUserDto: UpdateUserDto): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { auth0Id } });

    if (!user) {
      throw new NotFoundException(`User with Auth0 ID "${auth0Id}" not found`);
    }

    Object.assign(user, updateUserDto);

    return this.usersRepository.save(user);
  }

  async findOneByAuth0Id(auth0Id: string): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { auth0Id } });
    if (!user) {
      throw new NotFoundException(`User with Auth0 ID "${auth0Id}" not found`);
    }
    return user;
  }

  // Método nuevo: Busca un usuario por su Auth0 ID y lo crea si no existe.
  async findOrCreate(auth0Id: string): Promise<Users> {
    let user = await this.usersRepository.findOne({ where: { auth0Id } });

    if (!user) {
      const newUser = this.usersRepository.create({ auth0Id });
      user = await this.usersRepository.save(newUser);
      console.log(`Usuario con Auth0 ID "${auth0Id}" creado en la base de datos.`);
    }

    return user;
  }
}
