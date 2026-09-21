import express from 'express';
import mongoose from 'mongoose';
import { protect, requirePermission, restrictTo } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import Mesa from '../models/Mesa.js';
import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import {
  ESTADOS_PEDIDO,
  ESTADOS_PAGO,
  TIPOS_PEDIDO,
  isEnumValue
} from '../constants/pedido.js';
import { puedeTransicionarPedido } from '../constants/estadoPedido.js';
import {
  calcularTotalPedido,
  normalizarProductosEdicionPedido,
  normalizarProductosPedido,
  validarDatosClientePedido
} from '../utils/pedido.js';

const router = express.Router();

router.post('/', protect, requirePermission(PERMISSIONS.ORDERS_CREATE), asyncHandler(async (req, res) => {
  const { tipoPedido, nombreCliente, telefono, direccion, comentario, productos, mesaId } = req.body;

  if (!isEnumValue(tipoPedido, TIPOS_PEDIDO)) {
    throw new ApiError(400, 'tipoPedido inválido', {
      field: 'tipoPedido',
      allowedValues: Object.values(TIPOS_PEDIDO)
    });
  }

  validarDatosClientePedido({ tipoPedido, nombreCliente, telefono, direccion });

  if (!Array.isArray(productos) || productos.length === 0) {
    throw new ApiError(400, 'El pedido debe contener al menos un producto', { field: 'productos' });
  }

  if (tipoPedido === TIPOS_PEDIDO.SALON && !mesaId) {
    throw new ApiError(400, 'Los pedidos de salón requieren una mesa', { field: 'mesaId' });
  }

  if (tipoPedido !== TIPOS_PEDIDO.SALON && mesaId) {
    throw new ApiError(400, 'Solo los pedidos de salón pueden tener una mesa', { field: 'mesaId' });
  }

  let mesa = null;
  if (tipoPedido === TIPOS_PEDIDO.SALON) {
    if (!mongoose.isValidObjectId(mesaId)) {
      throw new ApiError(400, 'mesaId inválido', { field: 'mesaId' });
    }

    mesa = await Mesa.findById(mesaId);
    if (!mesa) throw new ApiError(404, 'Mesa no encontrada');
    if (!mesa.activa) throw new ApiError(409, 'La mesa no está activa');
    if (mesa.estado !== 'LIBRE') throw new ApiError(409, 'La mesa ya está ocupada');
  }

  const productoIds = productos.map((item) => item?.productoId);
  if (productoIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ApiError(400, 'Todos los productos deben tener un productoId válido', {
      field: 'productos.productoId'
    });
  }

  const productosDB = await Producto.find({ _id: { $in: productoIds } });
  const productosNormalizados = normalizarProductosPedido(productos, productosDB);
  const total = calcularTotalPedido(productosNormalizados);

  const pedido = new Pedido({
    tipoPedido,
    nombreCliente,
    telefono,
    direccion,
    comentario,
    productos: productosNormalizados,
    total,
    pagos: [],
    mesaId: mesa?._id ?? null,
    usuarioId: req.usuario.id,
    estadoPedido: ESTADOS_PEDIDO.ABIERTO,
    estadoPago: ESTADOS_PAGO.PENDIENTE
  });

  await pedido.save();

  if (mesa) {
    await Mesa.findByIdAndUpdate(mesa._id, { estado: 'OCUPADA' });
  }

  return res.status(201).json(pedido);
}));

router.get('/', protect, asyncHandler(async (req, res) => {
  const pedidos = await Pedido.find().sort({ fechaPedido: -1 });
  return res.json(pedidos);
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');
  return res.json(pedido);
}));


router.patch('/:id', protect, requirePermission(PERMISSIONS.ORDERS_EDIT), asyncHandler(async (req, res) => {
  const { productos, nombreCliente, telefono, direccion, comentario } = req.body;

  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.estadoPedido !== ESTADOS_PEDIDO.ABIERTO) {
    throw new ApiError(409, 'Solo se pueden editar pedidos abiertos', {
      estadoPedido: pedido.estadoPedido
    });
  }

  if (!Array.isArray(productos) || productos.length === 0) {
    throw new ApiError(400, 'El pedido debe contener al menos un producto', {
      field: 'productos'
    });
  }

  validarDatosClientePedido({
    tipoPedido: pedido.tipoPedido,
    nombreCliente,
    telefono,
    direccion
  });

  const productoIds = productos.map((item) => item?.productoId);
  if (productoIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ApiError(400, 'Todos los productos deben tener un productoId válido', {
      field: 'productos.productoId'
    });
  }

  const productosDB = await Producto.find({ _id: { $in: productoIds } });
  const productosNormalizados = normalizarProductosEdicionPedido(productos, pedido, productosDB);

  pedido.nombreCliente = nombreCliente;
  pedido.telefono = telefono;
  pedido.direccion = direccion;
  pedido.comentario = comentario ?? '';
  pedido.productos = productosNormalizados;
  pedido.total = calcularTotalPedido(productosNormalizados);

  await pedido.save();
  return res.json(pedido);
}));


// Cambio de estado: requiere orders:change_status. Las restricciones finas por rol/estado/tipo corresponden a F2/KDS.
router.patch('/:id/estado', protect, requirePermission(PERMISSIONS.ORDERS_CHANGE_STATUS), asyncHandler(async (req, res) => {
  const { estadoPedido } = req.body;

  if (!isEnumValue(estadoPedido, ESTADOS_PEDIDO)) {
    throw new ApiError(400, 'estadoPedido inválido', {
      field: 'estadoPedido',
      allowedValues: Object.values(ESTADOS_PEDIDO)
    });
  }

  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.estadoPedido === estadoPedido) return res.json(pedido);

  if (!puedeTransicionarPedido(pedido.estadoPedido, estadoPedido, pedido.tipoPedido)) {
    throw new ApiError(409, 'Transición de estado de pedido no permitida', {
      from: pedido.estadoPedido,
      to: estadoPedido,
      tipoPedido: pedido.tipoPedido
    });
  }

  pedido.estadoPedido = estadoPedido;
  await pedido.save();

  if (estadoPedido === ESTADOS_PEDIDO.ENTREGADO && pedido.tipoPedido === TIPOS_PEDIDO.SALON && pedido.mesaId) {
    await Mesa.findByIdAndUpdate(pedido.mesaId, { estado: 'LIBRE' });
  }

  return res.json(pedido);
}));

// Eliminación destructiva: solo ADMIN. La eliminación lógica se evaluará en F2/F4.
router.delete('/:id', protect, restrictTo(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  await Pedido.findByIdAndDelete(req.params.id);
  return res.json({ message: 'Pedido eliminado correctamente' });
}));

export default router;
