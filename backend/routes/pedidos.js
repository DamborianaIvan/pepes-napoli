import express from 'express';
import mongoose from 'mongoose';
import { protect, requirePermission, restrictTo } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ESTADOS_CAJA, ESTADOS_REGISTRO_PAGO, TIPOS_MOVIMIENTO_CAJA } from '../constants/caja.js';
import Mesa from '../models/Mesa.js';
import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import Caja from '../models/Caja.js';
import MovimientoCaja from '../models/MovimientoCaja.js';
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
import {
  calcularDescuento,
  marcarPagoAnulado,
  pedidoTienePagosRegistrados,
  redondearMoneda,
  validarPagosCobro
} from '../utils/finanzasPedido.js';

const router = express.Router();

const totalFinalPedido = (pedido) =>
  redondearMoneda(pedido.totalFinal ?? pedido.total);

const obtenerCajaAbierta = async () => {
  const caja = await Caja.findOne({ estado: ESTADOS_CAJA.ABIERTA });
  if (!caja) throw new ApiError(409, 'No hay una caja abierta');
  return caja;
};

const ajustarTotalCaja = (caja, metodo, diferencia) => {
  const actual = Number(caja.totalesPorMetodo?.[metodo] ?? 0);
  caja.totalesPorMetodo[metodo] = redondearMoneda(actual + diferencia);
};

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
    totalFinal: total,
    pagos: [],
    mesaId: mesa?._id ?? null,
    usuarioId: req.usuario.id,
    estadoPedido: ESTADOS_PEDIDO.EN_COCINA,
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

router.get('/cocina', protect, restrictTo(ROLES.ADMIN, ROLES.CAJERO, ROLES.CHEF), asyncHandler(async (req, res) => {
  const pedidos = await Pedido.find({
    estadoPedido: ESTADOS_PEDIDO.EN_COCINA
  }).populate('mesaId', 'numero nombre').sort({ fechaPedido: 1 });

  return res.json(pedidos);
}));

router.patch('/:id/listo', protect, restrictTo(ROLES.ADMIN, ROLES.CAJERO, ROLES.CHEF), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.cierre?.cerrado) {
    throw new ApiError(409, 'El pedido ya está cerrado');
  }

  if (pedido.estadoPedido !== ESTADOS_PEDIDO.EN_COCINA) {
    throw new ApiError(409, 'Solo se pueden marcar como listos los pedidos en cocina', {
      estadoPedido: pedido.estadoPedido
    });
  }

  if (!puedeTransicionarPedido(
    pedido.estadoPedido,
    ESTADOS_PEDIDO.LISTO,
    pedido.tipoPedido
  )) {
    throw new ApiError(409, 'Transición de estado de pedido no permitida', {
      from: pedido.estadoPedido,
      to: ESTADOS_PEDIDO.LISTO,
      tipoPedido: pedido.tipoPedido
    });
  }

  pedido.estadoPedido = ESTADOS_PEDIDO.LISTO;
  await pedido.save();

  return res.json(pedido);
}));

router.patch('/:id/descuento', protect, requirePermission(PERMISSIONS.CASH_CHARGE), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.cierre?.cerrado) {
    throw new ApiError(409, 'No se puede modificar un pedido cerrado');
  }

  if (pedido.estadoPedido === ESTADOS_PEDIDO.CANCELADO) {
    throw new ApiError(409, 'No se puede aplicar descuento a un pedido cancelado');
  }

  if (pedidoTienePagosRegistrados(pedido)) {
    throw new ApiError(409, 'No se puede modificar el descuento después de registrar un cobro');
  }

  const { porcentaje, monto, totalFinal } = calcularDescuento(pedido.total, req.body?.porcentaje);
  pedido.descuento = {
    porcentaje,
    monto,
    aplicadoPor: req.usuario.id,
    fecha: new Date()
  };
  pedido.totalFinal = totalFinal;
  pedido.estadoPago = totalFinal === 0 ? ESTADOS_PAGO.PAGADO : ESTADOS_PAGO.PENDIENTE;
  await pedido.save();

  return res.json(pedido);
}));

router.post('/:id/cobrar', protect, requirePermission(PERMISSIONS.CASH_CHARGE), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.cierre?.cerrado) {
    throw new ApiError(409, 'El pedido ya está cerrado');
  }

  if (pedido.estadoPedido === ESTADOS_PEDIDO.CANCELADO) {
    throw new ApiError(409, 'No se puede cobrar un pedido cancelado');
  }

  if (pedido.estadoPago === ESTADOS_PAGO.PAGADO) {
    throw new ApiError(409, 'El pedido ya se encuentra pagado');
  }

  const caja = await obtenerCajaAbierta();
  const totalFinal = totalFinalPedido(pedido);
  const pagos = validarPagosCobro(req.body?.pagos, totalFinal);
  const fecha = new Date();
  const totalesPrevios = new Map();
  const movimientosCreados = [];

  try {
    for (const pago of pagos) {
      if (!totalesPrevios.has(pago.metodo)) {
        totalesPrevios.set(pago.metodo, Number(caja.totalesPorMetodo?.[pago.metodo] ?? 0));
      }
      ajustarTotalCaja(caja, pago.metodo, pago.monto);
    }
    await caja.save();

    for (const pago of pagos) {
      const movimiento = await MovimientoCaja.create({
        cajaId: caja._id,
        pedidoId: pedido._id,
        tipo: TIPOS_MOVIMIENTO_CAJA.PAGO,
        metodo: pago.metodo,
        monto: pago.monto,
        usuarioId: req.usuario.id,
        fecha
      });
      movimientosCreados.push(movimiento._id);
    }

    pedido.totalFinal = totalFinal;
    pedido.pagos.push(...pagos.map((pago) => ({
      ...pago,
      usuarioId: req.usuario.id,
      cajaId: caja._id,
      fecha,
      estado: ESTADOS_REGISTRO_PAGO.ACTIVO
    })));
    pedido.estadoPago = ESTADOS_PAGO.PAGADO;
    await pedido.save();
  } catch (error) {
    for (const [metodo, valor] of totalesPrevios.entries()) {
      caja.totalesPorMetodo[metodo] = valor;
    }
    await caja.save().catch(() => {});
    if (movimientosCreados.length > 0) {
      await MovimientoCaja.deleteMany({ _id: { $in: movimientosCreados } }).catch(() => {});
    }
    throw error;
  }

  return res.json(pedido);
}));

router.post('/:id/anular-cobro', protect, requirePermission(PERMISSIONS.CASH_CHARGE), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.cierre?.cerrado) {
    throw new ApiError(409, 'No se puede anular el cobro de un pedido cerrado');
  }

  if (pedido.estadoPago !== ESTADOS_PAGO.PAGADO) {
    throw new ApiError(409, 'El pedido no tiene un cobro activo para anular');
  }

  const pagosActivos = pedido.pagos.filter(
    (pago) => (pago.estado ?? ESTADOS_REGISTRO_PAGO.ACTIVO) === ESTADOS_REGISTRO_PAGO.ACTIVO
  );
  if (pagosActivos.length === 0) {
    throw new ApiError(409, 'El pedido no tiene pagos activos');
  }

  const caja = await obtenerCajaAbierta();
  if (pagosActivos.some((pago) => pago.cajaId?.toString() !== caja._id.toString())) {
    throw new ApiError(409, 'El cobro pertenece a una caja que ya no está abierta');
  }

  const fecha = new Date();
  const totalesPrevios = new Map();
  const movimientosCreados = [];

  try {
    for (const pago of pagosActivos) {
      if (!totalesPrevios.has(pago.metodo)) {
        totalesPrevios.set(pago.metodo, Number(caja.totalesPorMetodo?.[pago.metodo] ?? 0));
      }
      ajustarTotalCaja(caja, pago.metodo, -pago.monto);
    }
    await caja.save();

    for (const pago of pagosActivos) {
      const movimiento = await MovimientoCaja.create({
        cajaId: caja._id,
        pedidoId: pedido._id,
        tipo: TIPOS_MOVIMIENTO_CAJA.ANULACION_PAGO,
        metodo: pago.metodo,
        monto: pago.monto,
        usuarioId: req.usuario.id,
        fecha
      });
      movimientosCreados.push(movimiento._id);
    }

    for (const pago of pagosActivos) {
      marcarPagoAnulado(pago, req.usuario.id, fecha);
    }
    pedido.estadoPago = ESTADOS_PAGO.ANULADO;
    await pedido.save();
  } catch (error) {
    for (const [metodo, valor] of totalesPrevios.entries()) {
      caja.totalesPorMetodo[metodo] = valor;
    }
    await caja.save().catch(() => {});
    if (movimientosCreados.length > 0) {
      await MovimientoCaja.deleteMany({ _id: { $in: movimientosCreados } }).catch(() => {});
    }
    throw error;
  }

  return res.json(pedido);
}));

router.post('/:id/cerrar', protect, requirePermission(PERMISSIONS.CASH_CHARGE), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.cierre?.cerrado) {
    return res.json(pedido);
  }

  if (pedido.estadoPago !== ESTADOS_PAGO.PAGADO) {
    throw new ApiError(409, 'El pedido debe estar pagado antes de cerrarse', {
      estadoPago: pedido.estadoPago
    });
  }

  const estadoFinalEsperado = pedido.tipoPedido === TIPOS_PEDIDO.SALON
    ? ESTADOS_PEDIDO.SERVIDO
    : ESTADOS_PEDIDO.ENTREGADO;

  if (pedido.estadoPedido !== estadoFinalEsperado) {
    throw new ApiError(409, 'El pedido debe completar su flujo operativo antes de cerrarse', {
      estadoPedido: pedido.estadoPedido,
      estadoRequerido: estadoFinalEsperado
    });
  }

  const cierreAnterior = {
    cerrado: pedido.cierre?.cerrado ?? false,
    fecha: pedido.cierre?.fecha ?? null,
    usuarioId: pedido.cierre?.usuarioId ?? null
  };

  pedido.cierre = {
    cerrado: true,
    fecha: new Date(),
    usuarioId: req.usuario.id
  };
  await pedido.save();

  if (pedido.tipoPedido === TIPOS_PEDIDO.SALON && pedido.mesaId) {
    try {
      const mesa = await Mesa.findById(pedido.mesaId);
      if (!mesa) throw new ApiError(409, 'No se encontró la mesa asociada al pedido');
      mesa.estado = 'LIBRE';
      await mesa.save();
    } catch (error) {
      pedido.cierre = cierreAnterior;
      await pedido.save().catch(() => {});
      throw error;
    }
  }

  return res.json(pedido);
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

  if (pedido.cierre?.cerrado) {
    throw new ApiError(409, 'No se puede editar un pedido cerrado');
  }

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

  const descuentoActual = calcularDescuento(
    pedido.total,
    pedido.descuento?.porcentaje ?? 0
  );
  pedido.descuento.monto = descuentoActual.monto;
  pedido.totalFinal = descuentoActual.totalFinal;

  await pedido.save();
  return res.json(pedido);
}));

router.patch('/:id/estado', protect, requirePermission(PERMISSIONS.ORDERS_CHANGE_STATUS), asyncHandler(async (req, res) => {
  const { estadoPedido } = req.body;

  if (!isEnumValue(estadoPedido, ESTADOS_PEDIDO)) {
    throw new ApiError(400, 'estadoPedido inválido', {
      field: 'estadoPedido',
      allowedValues: Object.values(ESTADOS_PEDIDO)
    });
  }

  if (estadoPedido === ESTADOS_PEDIDO.CANCELADO) {
    throw new ApiError(403, 'La cancelación requiere el permiso orders:cancel');
  }

  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.cierre?.cerrado) {
    throw new ApiError(409, 'El pedido ya está cerrado');
  }

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

  return res.json(pedido);
}));

router.patch('/:id/cancelar', protect, requirePermission(PERMISSIONS.ORDERS_CANCEL), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.cierre?.cerrado) {
    throw new ApiError(409, 'No se puede cancelar un pedido cerrado');
  }

  if (pedido.estadoPago === ESTADOS_PAGO.PAGADO && pedido.pagos.length > 0) {
    throw new ApiError(409, 'Debe anular el cobro antes de cancelar el pedido');
  }

  if (pedido.estadoPedido === ESTADOS_PEDIDO.ENTREGADO || pedido.estadoPedido === ESTADOS_PEDIDO.CANCELADO) {
    throw new ApiError(409, 'El pedido ya se encuentra en un estado final', {
      estadoPedido: pedido.estadoPedido
    });
  }

  if (!puedeTransicionarPedido(pedido.estadoPedido, ESTADOS_PEDIDO.CANCELADO, pedido.tipoPedido)) {
    throw new ApiError(409, 'El pedido no puede ser cancelado desde su estado actual', {
      estadoPedido: pedido.estadoPedido,
      tipoPedido: pedido.tipoPedido
    });
  }

  pedido.estadoPedido = ESTADOS_PEDIDO.CANCELADO;
  await pedido.save();

  if (pedido.tipoPedido === TIPOS_PEDIDO.SALON && pedido.mesaId) {
    await Mesa.findByIdAndUpdate(pedido.mesaId, { estado: 'LIBRE' });
  }

  return res.json(pedido);
}));

router.delete('/:id', protect, restrictTo(ROLES.ADMIN), asyncHandler(async (req, res) => {
  const pedido = await Pedido.findById(req.params.id);
  if (!pedido) throw new ApiError(404, 'Pedido no encontrado');

  if (pedido.estadoPedido !== ESTADOS_PEDIDO.ABIERTO) {
    throw new ApiError(409, 'Solo se puede eliminar de forma destructiva un pedido abierto', {
      estadoPedido: pedido.estadoPedido
    });
  }

  if (pedidoTienePagosRegistrados(pedido)) {
    throw new ApiError(409, 'No se puede eliminar un pedido con pagos registrados');
  }

  await Pedido.findByIdAndDelete(req.params.id);
  return res.json({ message: 'Pedido eliminado correctamente' });
}));

export default router;
