import express from 'express';
import { ESTADOS_CAJA, TIPOS_MOVIMIENTO_CAJA, crearTotalesPorMetodoVacios } from '../constants/caja.js';
import { METODOS_PAGO } from '../constants/pedido.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import Caja from '../models/Caja.js';
import MovimientoCaja from '../models/MovimientoCaja.js';
import { ApiError } from '../utils/apiError.js';
import { redondearMoneda } from '../utils/finanzasPedido.js';

const router = express.Router();

router.post('/abrir', protect, requirePermission(PERMISSIONS.CASH_OPEN), asyncHandler(async (req, res) => {
  const montoInicial = Number(req.body?.montoInicial);
  if (!Number.isFinite(montoInicial) || montoInicial < 0) {
    throw new ApiError(400, 'El monto inicial debe ser mayor o igual a cero', {
      field: 'montoInicial'
    });
  }

  const existente = await Caja.findOne({ estado: ESTADOS_CAJA.ABIERTA });
  if (existente) {
    throw new ApiError(409, 'Ya existe una caja abierta', { cajaId: existente._id });
  }

  const caja = await Caja.create({
    estado: ESTADOS_CAJA.ABIERTA,
    montoInicial: redondearMoneda(montoInicial),
    abiertaPor: req.usuario.id,
    totalesPorMetodo: crearTotalesPorMetodoVacios()
  });

  try {
    await MovimientoCaja.create({
      cajaId: caja._id,
      tipo: TIPOS_MOVIMIENTO_CAJA.APERTURA,
      monto: caja.montoInicial,
      usuarioId: req.usuario.id,
      fecha: caja.fechaApertura
    });
  } catch (error) {
    await Caja.findByIdAndDelete(caja._id);
    throw error;
  }

  return res.status(201).json(caja);
}));

router.get('/actual', protect, requirePermission(PERMISSIONS.CASH_CHARGE), asyncHandler(async (req, res) => {
  const caja = await Caja.findOne({ estado: ESTADOS_CAJA.ABIERTA })
    .populate('abiertaPor', 'nombre rol');

  return res.json(caja);
}));

router.get('/:id/movimientos', protect, requirePermission(PERMISSIONS.CASH_CHARGE), asyncHandler(async (req, res) => {
  const caja = await Caja.findById(req.params.id);
  if (!caja) throw new ApiError(404, 'Caja no encontrada');

  const movimientos = await MovimientoCaja.find({ cajaId: caja._id })
    .sort({ fecha: 1 });

  return res.json(movimientos);
}));

router.post('/cerrar', protect, requirePermission(PERMISSIONS.CASH_CLOSE), asyncHandler(async (req, res) => {
  const efectivoDeclarado = Number(req.body?.efectivoDeclarado);
  if (!Number.isFinite(efectivoDeclarado) || efectivoDeclarado < 0) {
    throw new ApiError(400, 'El efectivo declarado debe ser mayor o igual a cero', {
      field: 'efectivoDeclarado'
    });
  }

  const caja = await Caja.findOne({ estado: ESTADOS_CAJA.ABIERTA });
  if (!caja) throw new ApiError(409, 'No hay una caja abierta');

  const totales = crearTotalesPorMetodoVacios();
  for (const metodo of Object.values(METODOS_PAGO)) {
    totales[metodo] = redondearMoneda(caja.totalesPorMetodo?.[metodo] ?? 0);
  }

  const efectivoEsperado = redondearMoneda(
    caja.montoInicial + totales[METODOS_PAGO.EFECTIVO]
  );
  const declarado = redondearMoneda(efectivoDeclarado);

  caja.estado = ESTADOS_CAJA.CERRADA;
  caja.fechaCierre = new Date();
  caja.cerradaPor = req.usuario.id;
  caja.efectivoEsperado = efectivoEsperado;
  caja.efectivoDeclarado = declarado;
  caja.diferencia = redondearMoneda(declarado - efectivoEsperado);
  await caja.save();

  return res.json(caja);
}));

export default router;
