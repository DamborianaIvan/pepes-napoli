import { TIPOS_MOVIMIENTO_STOCK } from '../constants/stock.js';
import Ingrediente from '../models/Ingrediente.js';
import MovimientoStock from '../models/MovimientoStock.js';
import Receta from '../models/Receta.js';
import { ApiError } from '../utils/apiError.js';
import { calcularConsumosPedido, redondearCantidadStock } from '../utils/stock.js';

const cantidadPositiva = (valor, field = 'cantidad') => {
  const cantidad = Number(valor);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new ApiError(400, field + ' debe ser un número mayor a cero', { field });
  }
  return redondearCantidadStock(cantidad);
};

export const registrarMovimientoManual = async ({
  ingrediente,
  tipo,
  cantidad,
  stockObjetivo,
  motivo,
  usuarioId
}) => {
  const stockAnterior = redondearCantidadStock(ingrediente.stockActual ?? 0);
  let stockPosterior;
  let cantidadMovimiento;

  if (tipo === TIPOS_MOVIMIENTO_STOCK.AJUSTE) {
    const objetivo = Number(stockObjetivo);
    if (!Number.isFinite(objetivo) || objetivo < 0) {
      throw new ApiError(400, 'stockObjetivo debe ser un número mayor o igual a cero', {
        field: 'stockObjetivo'
      });
    }

    stockPosterior = redondearCantidadStock(objetivo);
    cantidadMovimiento = redondearCantidadStock(Math.abs(stockPosterior - stockAnterior));

    if (cantidadMovimiento === 0) {
      throw new ApiError(409, 'El ajuste no modifica el stock actual');
    }
  } else {
    cantidadMovimiento = cantidadPositiva(cantidad);
    const suma = tipo === TIPOS_MOVIMIENTO_STOCK.ENTRADA
      ? cantidadMovimiento
      : -cantidadMovimiento;

    stockPosterior = redondearCantidadStock(stockAnterior + suma);

    if (stockPosterior < 0) {
      throw new ApiError(409, 'El movimiento dejaría el stock por debajo de cero', {
        stockActual: stockAnterior,
        cantidad: cantidadMovimiento
      });
    }
  }

  ingrediente.stockActual = stockPosterior;
  await ingrediente.save();

  try {
    return await MovimientoStock.create({
      ingredienteId: ingrediente._id,
      tipo,
      cantidad: cantidadMovimiento,
      stockAnterior,
      stockPosterior,
      motivo: motivo?.trim() ?? '',
      usuarioId
    });
  } catch (error) {
    ingrediente.stockActual = stockAnterior;
    await ingrediente.save().catch(() => {});
    throw error;
  }
};

export const consumirStockPedido = async (pedido, usuarioId) => {
  const yaConsumido = await MovimientoStock.exists({
    pedidoId: pedido._id,
    tipo: TIPOS_MOVIMIENTO_STOCK.CONSUMO
  });

  if (yaConsumido) {
    return { aplicado: false, consumos: [] };
  }

  const productoIds = pedido.productos
    .map((item) => item.productoId)
    .filter(Boolean);

  if (productoIds.length === 0) {
    return { aplicado: true, consumos: [] };
  }

  const recetas = await Receta.find({
    productoId: { $in: productoIds },
    activa: true
  }).lean();

  const consumos = calcularConsumosPedido(pedido.productos, recetas);
  if (consumos.length === 0) {
    return { aplicado: true, consumos: [] };
  }

  const ingredientes = await Ingrediente.find({
    _id: { $in: consumos.map((item) => item.ingredienteId) }
  });

  const ingredientePorId = new Map(
    ingredientes.map((ingrediente) => [ingrediente._id.toString(), ingrediente])
  );

  const estadosPrevios = [];
  const movimientosCreados = [];

  try {
    for (const consumo of consumos) {
      const ingrediente = ingredientePorId.get(consumo.ingredienteId);
      if (!ingrediente) {
        throw new ApiError(409, 'Una receta referencia un ingrediente inexistente', {
          ingredienteId: consumo.ingredienteId
        });
      }

      const stockAnterior = redondearCantidadStock(ingrediente.stockActual ?? 0);
      const stockPosterior = redondearCantidadStock(stockAnterior - consumo.cantidad);

      estadosPrevios.push({ ingrediente, stockAnterior });
      ingrediente.stockActual = stockPosterior;
      await ingrediente.save();

      const movimiento = await MovimientoStock.create({
        ingredienteId: ingrediente._id,
        tipo: TIPOS_MOVIMIENTO_STOCK.CONSUMO,
        cantidad: consumo.cantidad,
        stockAnterior,
        stockPosterior,
        motivo: 'Consumo automático por pedido #' + String(pedido._id).slice(-6),
        pedidoId: pedido._id,
        usuarioId
      });

      movimientosCreados.push(movimiento._id);
    }
  } catch (error) {
    for (const { ingrediente, stockAnterior } of estadosPrevios) {
      ingrediente.stockActual = stockAnterior;
      await ingrediente.save().catch(() => {});
    }

    if (movimientosCreados.length > 0) {
      await MovimientoStock.deleteMany({ _id: { $in: movimientosCreados } }).catch(() => {});
    }

    throw error;
  }

  return { aplicado: true, consumos };
};
