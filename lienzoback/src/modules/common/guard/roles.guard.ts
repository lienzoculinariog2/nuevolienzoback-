// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Roles[]>('roles', context.getHandler());

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      return false;
    }

    // ❌ Bloquea baneados en toda la app
    if (user.roles === Roles.BANNED) {
      return false;
    }

    // ✅ Si no hay roles requeridos en el handler, permite acceso por defecto
    if (!requiredRoles) {
      return true;
    }

    // ✅ Verifica si el rol del usuario está en los roles requeridos
    return requiredRoles.includes(user.roles);
  }
}
