import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULES_KEY } from '../decorators/modules.decorator';

@Injectable()
export class ModulesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredModules = this.reflector.getAllAndOverride<string[]>(MODULES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredModules) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    // SUPERADMIN always has access to all modules
    if (user.rol === 'SUPERADMIN') {
      return true;
    }

    const permittedModules = user.modulosPermitidos || [];
    
    // Check if user has ALL the required modules (or ANY? ANY is more standard)
    return requiredModules.some((mod) => permittedModules.includes(mod));
  }
}
