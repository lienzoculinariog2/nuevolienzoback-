// src/common/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Roles[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true; // Si no hay roles definidos, permite el acceso.
    }

    const { user } = context.switchToHttp().getRequest();
    // Verifica si el rol del usuario está incluido en los roles requeridos.
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
