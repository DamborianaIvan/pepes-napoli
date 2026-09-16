import express from 'express';
import { protect } from '../middleware/auth.js';
import Mesa from '../models/Mesa.js';
import Pedido from '../models/Pedido.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import {
  ESTADOS_PEDIDO,
  ESTADOS_PAGO,
  TIPOS_PEDIDO,
  isEnumValue
} from '../constants/pedido.js';
import { puedeTransicionarPedido } from '../constants/estadoPedido.js';

const router = express.Router();

router.post('/', protect, asyncHandler(async (req, res) => {
  const pedidoData = {
    ...req.body,
    usuarioId: req.usuario.id
  };

  if (!isEnumValue(pedidoData.tipoPedido, TIPOS_PEDIDO)) {
    throw new ApiError(400, 'tipoPedido inválido', {
      field: 'tipoPedido',
      allowedValues: Object.values(TIPOS_PEDIDO)
    });
  }

  if (!Array.isArray(pedidoData.productos) || pedidoData.productos.length === 0) {
    throw new ApiError(400, 'El pedido debe contener al menos un producto', {
      field: 'productos'
    });
  }

  if (pedidoData.tipoPedido === TIPOS_PEDIDO.SALON && pedidoData.mesaId) {
    const mesa = await Mesa.findById(pedidoData.mesaId);

    if (!mesa) {
      throw new ApiError(404, 'Mesa no encontrada');
    }

    if (mesa.estado !== 'LIBRE') {
      throw new ApiError(409, 'La mesa ya está ocupada');
    }
  }

  const pedido = new Pedido({
    ...pedidoData,
    estadoPedido: ESTADOS_PEDIDO.ABIERTO,
    estadoPago: ESTADOS_PAGO.PENDIENTE
  });

  await pedido.save();

  if (pedido.tipoPedido === TIPOS_PEDIDO.SALON && pedido.mesaId) {
    await Mesa.findByIdAndUpdate(pedido.mesaId, { estado: 'OCUPADA' });
  }

  return res.status(201).json(pedido);
}));

router.get('/', protect, asyncHandler(async (req, res) => {
  const pedidos = await Pedido.find().sort({ fechaPedido: -1 });
  return res.json(pedidos);
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);

  if (!pedido) {
    throw new ApiError(404, 'Pedido no encontrado');
  }

  return res.json(pedido);
}));

router.patch('/:id/estado', protect, asyncHandler(async (req, res) => {
  const { estadoPedido } = req.body;

  if (!isEnumValue(estadoPedido, ESTADOS_PEDIDO)) {
    throw new ApiError(400, 'estadoPedido inválido', {
      field: 'estadoPedido',
      allowedValues: Object.values(ESTADOS_PEDIDO)
    });
  }

  const pedido = await Pedido.findById(req.params.id);

  if (!pedido) {
    throw new ApiError(404, 'Pedido no encontrado');
  }

  if (pedido.estadoPedido === estadoPedido) {
    return res.json(pedido);
  }

  if (!puedeTransicionarPedido(pedido.estadoPedido, estadoPedido)) {
    throw new ApiError(409, 'Transición de estado de pedido no permitida', {
      from: pedido.estadoPedido,
      to: estadoPedido
    });
  }

  pedido.estadoPedido = estadoPedido;
  await pedido.save();

  if (estadoPedido === ESTADOS_PEDIDO.ENTREGADO && pedido.tipoPedido === TIPOS_PEDIDO.SALON && pedido.mesaId) {
    await Mesa.findByIdAndUpdate(pedido.mesaId, { estado: 'LIBRE' });
  }

  return res.json(pedido);
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);

  if (!pedido) {
    throw new ApiError(404, 'Pedido no encontrado');
  }

  await Pedido.findByIdAndDelete(req.params.id);

  return res.json({ message: 'Pedido eliminado correctamente' });
}));

export default router;
