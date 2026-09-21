import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { TIPOS_PEDIDO } from '../constants/pedido.js';
import { ApiError } from './apiError.js';
import {
  calcularTotalPedido,
  normalizarProductosEdicionPedido,
  normalizarProductosPedido,
  validarDatosClientePedido
} from './pedido.js';

const productoId = new mongoose.Types.ObjectId();

const productoDisponible = {
  _id: productoId,
  nombre: 'Pizza Margherita',
  precio: 8500,
  disponible: true
};

test('delivery requiere nombre, teléfono y dirección', () => {
  assert.doesNotThrow(() => validarDatosClientePedido({
    tipoPedido: TIPOS_PEDIDO.DELIVERY,
    nombreCliente: 'Ana',
    telefono: '123456',
    direccion: 'Calle 123'
  }));

  assert.throws(
    () => validarDatosClientePedido({
      tipoPedido: TIPOS_PEDIDO.DELIVERY,
      nombreCliente: 'Ana',
      telefono: '',
      direccion: 'Calle 123'
    }),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});

test('takeaway requiere nombre y teléfono', () => {
  assert.doesNotThrow(() => validarDatosClientePedido({
    tipoPedido: TIPOS_PEDIDO.TAKEAWAY,
    nombreCliente: 'Ana',
    telefono: '123456'
  }));

  assert.throws(
    () => validarDatosClientePedido({
      tipoPedido: TIPOS_PEDIDO.TAKEAWAY,
      nombreCliente: 'Ana',
      telefono: ' '
    }),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});

test('salón no exige datos de cliente', () => {
  assert.doesNotThrow(() => validarDatosClientePedido({
    tipoPedido: TIPOS_PEDIDO.SALON
  }));
});

test('normaliza productos usando precio y nombre del producto persistido', () => {
  const resultado = normalizarProductosPedido(
    [{ productoId: productoId.toString(), cantidad: 2, precio: 1 }],
    [productoDisponible]
  );

  assert.deepEqual(resultado[0], {
    productoId,
    nombreSnapshot: 'Pizza Margherita',
    cantidad: 2,
    precioUnitario: 8500,
    subtotal: 17000
  });
  assert.equal(calcularTotalPedido(resultado), 17000);
});

test('rechaza producto inexistente o no disponible', () => {
  const inexistente = new mongoose.Types.ObjectId();

  assert.throws(
    () => normalizarProductosPedido(
      [{ productoId: inexistente.toString(), cantidad: 1 }],
      [productoDisponible]
    ),
    (error) => error instanceof ApiError && error.statusCode === 404
  );

  assert.throws(
    () => normalizarProductosPedido(
      [{ productoId: productoId.toString(), cantidad: 1 }],
      [{ ...productoDisponible, disponible: false }]
    ),
    (error) => error instanceof ApiError && error.statusCode === 409
  );
});

test('rechaza cantidades no enteras o menores a uno', () => {
  assert.throws(
    () => normalizarProductosPedido(
      [{ productoId: productoId.toString(), cantidad: 1.5 }],
      [productoDisponible]
    ),
    (error) => error instanceof ApiError && error.statusCode === 400
  );

  assert.throws(
    () => normalizarProductosPedido(
      [{ productoId: productoId.toString(), cantidad: 0 }],
      [productoDisponible]
    ),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});


test('edición conserva snapshot y precio histórico de productos existentes', () => {
  const pedido = {
    productos: [{
      productoId,
      nombreSnapshot: 'Pizza Margherita',
      cantidad: 1,
      precioUnitario: 8000,
      subtotal: 8000
    }]
  };

  const resultado = normalizarProductosEdicionPedido(
    [{ productoId: productoId.toString(), cantidad: 3 }],
    pedido,
    [{ ...productoDisponible, precio: 9500, nombre: 'Pizza Margherita XL' }]
  );

  assert.deepEqual(resultado[0], {
    productoId,
    nombreSnapshot: 'Pizza Margherita',
    cantidad: 3,
    precioUnitario: 8000,
    subtotal: 24000
  });
});

test('edición toma snapshot y precio actuales al agregar un producto nuevo', () => {
  const nuevoProductoId = new mongoose.Types.ObjectId();
  const nuevoProducto = {
    _id: nuevoProductoId,
    nombre: 'Empanada',
    precio: 2200,
    disponible: true
  };

  const resultado = normalizarProductosEdicionPedido(
    [{ productoId: nuevoProductoId.toString(), cantidad: 2 }],
    { productos: [] },
    [nuevoProducto]
  );

  assert.deepEqual(resultado[0], {
    productoId: nuevoProductoId,
    nombreSnapshot: 'Empanada',
    cantidad: 2,
    precioUnitario: 2200,
    subtotal: 4400
  });
});

test('edición rechaza productos repetidos y cantidades inválidas', () => {
  const items = [
    { productoId: productoId.toString(), cantidad: 1 },
    { productoId: productoId.toString(), cantidad: 2 }
  ];

  assert.throws(
    () => normalizarProductosEdicionPedido(items, { productos: [] }, [productoDisponible]),
    (error) => error instanceof ApiError && error.statusCode === 400
  );

  assert.throws(
    () => normalizarProductosEdicionPedido(
      [{ productoId: productoId.toString(), cantidad: 0 }],
      { productos: [] },
      [productoDisponible]
    ),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});
