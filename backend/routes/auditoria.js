import express from 'express';
import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';
import { ACCIONES_AUDITORIA, ENTIDADES_AUDITORIA } from '../constants/auditoria.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import AuditLog from '../models/AuditLog.js';
import { ApiError } from '../utils/apiError.js';

const router = express.Router();

router.use(protect, restrictTo(ROLES.ADMIN));

router.get('/', asyncHandler(async (req, res) => {
  const limiteSolicitado = Number(req.query.limit ?? 100);
  const limit = Math.min(Math.max(Number.isInteger(limiteSolicitado) ? limiteSolicitado : 100, 1), 200);

  const filtro = {};

  if (req.query.accion) {
    if (!Object.values(ACCIONES_AUDITORIA).includes(req.query.accion)) {
      throw new ApiError(400, 'Acción de auditoría inválida', { field: 'accion' });
    }
    filtro.accion = req.query.accion;
  }

  if (req.query.entidad) {
    if (!Object.values(ENTIDADES_AUDITORIA).includes(req.query.entidad)) {
      throw new ApiError(400, 'Entidad de auditoría inválida', { field: 'entidad' });
    }
    filtro.entidad = req.query.entidad;
  }

  if (req.query.entidadId) {
    if (!mongoose.isValidObjectId(req.query.entidadId)) {
      throw new ApiError(400, 'entidadId inválido', { field: 'entidadId' });
    }
    filtro.entidadId = req.query.entidadId;
  }

  const logs = await AuditLog.find(filtro)
    .populate('usuarioId', 'nombre nombreUsuario rol')
    .sort({ fecha: -1 })
    .limit(limit)
    .lean();

  return res.json(logs);
}));

export default router;
