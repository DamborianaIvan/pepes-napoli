import { TIPOS_PEDIDO } from '../constants/pedido.js';
import { ApiError } from './apiError.js';

const textoNoVacio = (value) => typeof value === 'string' && value.trim().length > 0;

export const validarDatosClientePedido = ({
  tipoPedido,
  nombreCliente,
  telefono,
  direccion
}) => {
  if (tipoPedido === TIPOS_PEDIDO.DELIVERY) {
    if (!textoNoVacio(nombreCliente) || !textoNoVacio(telefono) || !textoNoVacio(direccion)) {
      throw new ApiError(400, 'Los pedidos de delivery requieren nombre, teléfono y dirección', {
        fields: ['nombreCliente', 'telefono', 'direccion']
      });
    }
  }

  if (tipoPedido === TIPOS_PEDIDO.TAKEAWAY) {
    if (!textoNoVacio(nombreCliente) || !textoNoVacio(telefono)) {
      throw new ApiError(400, 'Los pedidos takeaway requieren nombre y teléfono', {
        fields: ['nombreCliente', 'telefono']
      });
    }
  }
};

export const normalizarProductosPedido = (productos, productosDB) => {
  const productosMap = new Map(
    productosDB.map((producto) => [producto._id.toString(), producto])
  );

  return productos.map((item, index) => {
    const producto = productosMap.get(item.productoId.toString());

    if (!producto) {
      throw new ApiError(404, 'Producto no encontrado', {
        field: `productos[${index}].productoId`,
        productoId: item.productoId
      });
    }

    if (!producto.disponible) {
      throw new ApiError(409, 'Producto no disponible', {
        field: `productos[${index}].productoId`,
        productoId: item.productoId
      });
    }

    const cantidad = Number(item.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ApiError(400, 'La cantidad debe ser un entero mayor a cero', {
        field: `productos[${index}].cantidad`
      });
    }

    const precioUnitario = Number(producto.precio);
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      throw new ApiError(500, 'El precio del producto es inválido', {
        productoId: producto._id
      });
    }

    const subtotal = precioUnitario * cantidad;

    return {
      productoId: producto._id,
      nombreSnapshot: producto.nombre,
      cantidad,
      precioUnitario,
      subtotal
    };
  });
};

export const calcularTotalPedido = (productos) =>
  productos.reduce((sum, item) => sum + item.subtotal, 0);


export const normalizarProductosEdicionPedido = (productos, pedido, productosDB) => {
  const productosExistentes = new Map(
    pedido.productos.map((item) => [item.productoId?.toString(), item])
  );
  const productosMap = new Map(
    productosDB.map((producto) => [producto._id.toString(), producto])
  );
  const ids = new Set();

  return productos.map((item, index) => {
    if (!item?.productoId) {
      throw new ApiError(400, 'Todos los productos deben tener un productoId válido', {
        field: `productos[${index}].productoId`
      });
    }

    const productoId = item.productoId.toString();
    if (ids.has(productoId)) {
      throw new ApiError(400, 'No se permiten productos repetidos en el pedido', {
        field: `productos[${index}].productoId`
      });
    }
    ids.add(productoId);

    const cantidad = Number(item.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ApiError(400, 'La cantidad debe ser un entero mayor a cero', {
        field: `productos[${index}].cantidad`
      });
    }

    const existente = productosExistentes.get(productoId);
    if (existente) {
      return {
        productoId: existente.productoId,
        nombreSnapshot: existente.nombreSnapshot,
        cantidad,
        precioUnitario: existente.precioUnitario,
        subtotal: existente.precioUnitario * cantidad
      };
    }

    const producto = productosMap.get(productoId);
    if (!producto) {
      throw new ApiError(404, 'Producto no encontrado', {
        field: `productos[${index}].productoId`,
        productoId: item.productoId
      });
    }

    if (!producto.disponible) {
      throw new ApiError(409, 'Producto no disponible', {
        field: `productos[${index}].productoId`,
        productoId: item.productoId
      });
    }

    const precioUnitario = Number(producto.precio);
    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      throw new ApiError(500, 'El precio del producto es inválido', {
        productoId: producto._id
      });
    }

    return {
      productoId: producto._id,
      nombreSnapshot: producto.nombre,
      cantidad,
      precioUnitario,
      subtotal: precioUnitario * cantidad
    };
  });
};
