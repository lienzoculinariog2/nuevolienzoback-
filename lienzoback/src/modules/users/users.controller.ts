import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles, Users } from './entities/user.entity';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';
import { RolesGuard } from '../common/guard/roles.guard';
import { HasRoles } from '../decorators/roles';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  //@UseGuards(AuthGuard('jwt'))
  async findAll(): Promise<Users[]> {
    return this.usersService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createUserDto: CreateUserDto): Promise<Users> {
    return this.usersService.create(createUserDto);
  }

  @Post('test')
  async createTestUser(): Promise<Users> {
    const testUserDto: CreateUserDto = {
      id: 'test-user-' + Date.now(),
      email: 'test@example.com',
    };
    return this.usersService.create(testUserDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string): Promise<Users> {
    return this.usersService.findOneById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ): Promise<Users> {
    if (id !== req.user.sub) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil.');
    }
    return this.usersService.update(id, updateUserDto);
  }

  // PATCH /users/:id/role
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HasRoles(Roles.ADMIN)
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('newRole') newRole: Roles, // 👈 viene en el body
    @Req() req,
  ) {
    const currentUser = req.user; // 👈 usuario logueado extraído del token JWT
    return this.usersService.updateRole(id, newRole, currentUser);
  }
}
