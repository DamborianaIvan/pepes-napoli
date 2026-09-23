import test from 'node:test';
import assert from 'node:assert/strict';
import { productoRequiereArchivo } from './producto.js';

test('producto con pedidos históricos requiere archivo', () => {
  assert.equal(productoRequiereArchivo({ tienePedidos: true, tieneReceta: false }), true);
});

test('producto con receta requiere archivo', () => {
  assert.equal(productoRequiereArchivo({ tienePedidos: false, tieneReceta: true }), true);
});

test('producto sin referencias puede eliminarse físicamente', () => {
  assert.equal(productoRequiereArchivo({ tienePedidos: false, tieneReceta: false }), false);
});
