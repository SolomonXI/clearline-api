import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../decorators/current-user.decorator';

const roleHierarchy: Record<MemberRole, number> = {
  [MemberRole.VIEWER]: 0,
  [MemberRole.ANALYST]: 1,
  [MemberRole.ACCOUNTANT]: 2,
  [MemberRole.AP_MANAGER]: 3,
  [MemberRole.CONTROLLER]: 4,
  [MemberRole.OWNER]: 5,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: JwtPayload }>();
    const userLevel = roleHierarchy[user.role as MemberRole] ?? -1;
    const minRequired = Math.min(
      ...requiredRoles.map((r) => roleHierarchy[r]),
    );

    if (userLevel < minRequired) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
