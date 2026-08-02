import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserOwnershipGuard } from '../guard/user-ownership.guard';
import { Roles } from '../../users/entities/user.entity';

describe('UserOwnershipGuard', () => {
  const guard = new UserOwnershipGuard();

  function context(sub: string, requestedUserId: string, roles = Roles.CUSTOMER) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub, roles },
          params: { userId: requestedUserId },
        }),
      }),
    } as ExecutionContext;
  }

  it('allows a user to access their own resource', () => {
    expect(guard.canActivate(context('auth0-user', 'auth0-user'))).toBe(true);
  });

  it('allows an administrator to access another user resource', () => {
    expect(guard.canActivate(context('admin-user', 'auth0-user', Roles.ADMIN))).toBe(true);
  });

  it('rejects a user accessing another user resource', () => {
    expect(() => guard.canActivate(context('attacker', 'auth0-user'))).toThrow(ForbiddenException);
  });
});
