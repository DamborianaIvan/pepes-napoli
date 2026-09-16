import mongoose from 'mongoose';
import { config, validateConfig } from '../config.js';
import Producto from '../models/Producto.js';
import { ESTADOS_PAGO, ESTADOS_PEDIDO, METODOS_PAGO, TIPOS_PEDIDO } from '../constants/pedido.js';

const LEGACY_STATE_MAP = Object.freeze({
  ABIERTO: { estadoPedido: ESTADOS_PEDIDO.ABIERTO, estadoPago: ESTADOS_PAGO.PENDIENTE },
  CONFIRMADO: { estadoPedido: ESTADOS_PEDIDO.CONFIRMADO, estadoPago: ESTADOS_PAGO.PENDIENTE },
  EN_COCINA: { estadoPedido: ESTADOS_PEDIDO.EN_COCINA, estadoPago: ESTADOS_PAGO.PENDIENTE },
  LISTO: { estadoPedido: ESTADOS_PEDIDO.LISTO, estadoPago: ESTADOS_PAGO.PENDIENTE },
  EN_CAMINO: { estadoPedido: ESTADOS_PEDIDO.EN_CAMINO, estadoPago: ESTADOS_PAGO.PENDIENTE },
  ENTREGADO: { estadoPedido: ESTADOS_PEDIDO.ENTREGADO, estadoPago: ESTADOS_PAGO.PENDIENTE },
  PAGADO: { estadoPedido: ESTADOS_PEDIDO.ENTREGADO, estadoPago: ESTADOS_PAGO.PAGADO },
  CANCELADO: { estadoPedido: ESTADOS_PEDIDO.CANCELADO, estadoPago: ESTADOS_PAGO.ANULADO },
});

const PAYMENT_METHOD_MAP = Object.freeze({
  EFECTIVO: METODOS_PAGO.EFECTIVO,
  TRANSFERENCIA: METODOS_PAGO.TRANSFERENCIA,
  DEBITO: METODOS_PAGO.DEBITO,
  CREDITO: METODOS_PAGO.CREDITO,
});

const normalizeTipoPedido = (pedido) => {
  if (pedido.tipoPedido && Object.values(TIPOS_PEDIDO).includes(pedido.tipoPedido)) {
    return pedido.tipoPedido;
  }

  if (pedido.tipoEntrega === 'DELIVERY') return TIPOS_PEDIDO.DELIVERY;
  if (pedido.tipoEntrega === 'TAKEAWAY') return TIPOS_PEDIDO.TAKEAWAY;
  return TIPOS_PEDIDO.SALON;
};

const migrateProductos = async (productos) => {
  const migrated = [];

  for (const item of Array.isArray(productos) ? productos : []) {
    const nombreSnapshot = String(item.nombreSnapshot ?? item.producto ?? '').trim();
    const cantidad = Number(item.cantidad ?? 0);
    const precioUnitario = Number(item.precioUnitario ?? item.precio ?? 0);

    if (!nombreSnapshot || !Number.isFinite(cantidad) || cantidad < 1 || !Number.isFinite(precioUnitario) || precioUnitario < 0) {
      throw new Error(`Producto legacy inválido: ${JSON.stringify(item)}`);
    }

    let productoId = item.productoId ?? null;

    if (!productoId && item.producto) {
      const producto = await Producto.findOne({ nombre: item.producto }).select('_id').lean();
      productoId = producto?._id ?? null;
    }

    migrated.push({
      productoId,
      nombreSnapshot,
      cantidad,
      precioUnitario,
      subtotal: Math.round(cantidad * precioUnitario * 100) / 100,
    });
  }

  return migrated;
};

const migrate = async () => {
  validateConfig();
  await mongoose.connect(config.mongoUri);

  const collection = mongoose.connection.collection('pedidos');
  const legacyPedidos = await collection.find({
    $or: [
      { estado: { $exists: true } },
      { metodoPago: { $exists: true } },
      { 'productos.producto': { $exists: true } },
      { 'productos.precio': { $exists: true } },
    ],
  }).toArray();

  let migratedCount = 0;

  for (const pedido of legacyPedidos) {
    const estadoLegacy = pedido.estado ?? 'ABIERTO';
    const mappedState = LEGACY_STATE_MAP[estadoLegacy];

    if (!mappedState) {
      throw new Error(`Estado legacy no reconocido en pedido ${pedido._id}: ${estadoLegacy}`);
    }

    const productos = await migrateProductos(pedido.productos);
    const total = Number(pedido.total ?? productos.reduce((sum, item) => sum + item.subtotal, 0));

    if (!Number.isFinite(total) || total < 0) {
      throw new Error(`Total inválido en pedido ${pedido._id}: ${pedido.total}`);
    }

    const pagos = Array.isArray(pedido.pagos)
      ? pedido.pagos
      : pedido.metodoPago && Number.isFinite(total)
        ? [{ metodo: PAYMENT_METHOD_MAP[pedido.metodoPago] ?? METODOS_PAGO.EFECTIVO, monto: total }]
        : [];

    await collection.updateOne(
      { _id: pedido._id },
      {
        $set: {
          tipoPedido: normalizeTipoPedido(pedido),
          productos,
          total,
          pagos,
          estadoPedido: pedido.estadoPedido ?? mappedState.estadoPedido,
          estadoPago: pedido.estadoPago ?? mappedState.estadoPago,
          nombreCliente: pedido.nombreCliente ?? null,
          telefono: pedido.telefono ?? null,
          direccion: pedido.direccion ?? null,
          mesaId: pedido.mesaId ?? null,
          usuarioId: pedido.usuarioId ?? null,
          comentario: pedido.comentario ?? '',
          fechaPedido: pedido.fechaPedido ?? pedido.createdAt ?? new Date(),
        },
        $unset: {
          estado: '',
          metodoPago: '',
          tipoEntrega: '',
        },
      }
    );

    migratedCount += 1;
  }

  console.log(`Pedidos legacy detectados: ${legacyPedidos.length}`);
  console.log(`Pedidos migrados: ${migratedCount}`);
};

try {
  await migrate();
} catch (error) {
  console.error('Error migrando pedidos:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
