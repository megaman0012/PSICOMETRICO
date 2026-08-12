import { Request } from 'express';

export interface AutenticatedUser {
  id: number;
  email: string;
  rol: string;
}

export interface AuthenticatedRequest extends Request {
  user: AutenticatedUser;
}
