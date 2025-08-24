import { SetMetadata } from '@nestjs/common';
import { Roles } from '../users/entities/user.entity';

// Usa un nombre más descriptivo como 'HasRoles'
export const HasRoles = (...roles: Roles[]) => SetMetadata('roles', roles);
