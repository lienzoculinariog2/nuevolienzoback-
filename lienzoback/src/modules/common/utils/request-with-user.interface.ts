// src/common/interfaces/request-with-user.interface.ts
import { Request } from 'express';
import { Roles } from '../../users/entities/user.entity';

// Define la estructura del payload del JWT que te da Auth0
interface JwtPayload {
  sub: string; // El ID del usuario de Auth0
  email: string;
  name: string;
  roles: Roles;
  // Puedes añadir más campos si tu token los tiene
}

// Extiende el tipo Request para incluir la propiedad 'user'
export interface RequestWithUser extends Request {
  user: JwtPayload;
}
