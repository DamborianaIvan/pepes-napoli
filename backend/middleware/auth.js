import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { PERMISSIONS_VALUES, hasPermission } from '../constants/permissions.js';
import Usuario from '../models/Usuario.js';
import { ApiError } from '../utils/apiError.js';

export const protect = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Autenticación requerida', {
      reason: 'MISSING_TOKEN'
    }));
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    return next(new ApiError(401, 'Autenticación requerida', {
      reason: 'MISSING_TOKEN'
    }));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const usuario = await Usuario.findById(payload.id);

    if (!usuario || !usuario.activo) {
      return next(new ApiError(401, 'Usuario inactivo o no encontrado', {
        reason: 'INACTIVE_USER'
      }));
    }

    req.usuario = {
      id: usuario._id.toString(),
      rol: usuario.rol,
      nombre: usuario.nombre
    };

    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);

    return next(new ApiError(401, 'Token inválido o expirado', {
      reason: 'INVALID_TOKEN'
    }));
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return next(new ApiError(403, 'No tiene permisos para realizar esta acción', {
        reason: 'INSUFFICIENT_ROLE'
      }));
    }
    return next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new ApiError(401, 'Autenticación requerida', {
        reason: 'MISSING_AUTH_CONTEXT'
      }));
    }

    if (!PERMISSIONS_VALUES.includes(permission)) {
      return next(new ApiError(500, 'Permiso no configurado en el sistema', {
        reason: 'INVALID_PERMISSION',
        permission
      }));
    }

    if (!hasPermission(req.usuario.rol, permission)) {
      return next(new ApiError(403, 'No tiene permisos para realizar esta acción', {
        reason: 'INSUFFICIENT_PERMISSION',
        permission
      }));
    }

    return next();
  };
};
