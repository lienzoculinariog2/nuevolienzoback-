import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Roles } from '../../users/entities/user.entity';
import type { RequestWithUser } from '../utils/request-with-user.interface';

@Injectable()
export class UserOwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const requestedUserId = request.params.userId;

    if (request.user.roles === Roles.ADMIN || request.user.sub === requestedUserId) {
      return true;
    }

    throw new ForbiddenException('No tienes permiso para acceder a los recursos de este usuario.');
  }
}
