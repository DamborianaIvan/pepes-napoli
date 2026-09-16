import test from 'node:test';
import assert from 'node:assert/strict';
import { ESTADOS_PEDIDO } from './pedido.js';
import { puedeTransicionarPedido } from './estadoPedido.js';

const { ABIERTO, CONFIRMADO, EN_COCINA, LISTO, EN_CAMINO, ENTREGADO, CANCELADO } = ESTADOS_PEDIDO;

test('permite el flujo operativo principal', () => {
  assert.equal(puedeTransicionarPedido(ABIERTO, CONFIRMADO), true);
  assert.equal(puedeTransicionarPedido(CONFIRMADO, EN_COCINA), true);
  assert.equal(puedeTransicionarPedido(EN_COCINA, LISTO), true);
  assert.equal(puedeTransicionarPedido(LISTO, EN_CAMINO), true);
  assert.equal(puedeTransicionarPedido(EN_CAMINO, ENTREGADO), true);
});

test('permite entregar directamente un pedido listo', () => {
  assert.equal(puedeTransicionarPedido(LISTO, ENTREGADO), true);
});

test('permite cancelar pedidos no terminales', () => {
  assert.equal(puedeTransicionarPedido(ABIERTO, CANCELADO), true);
  assert.equal(puedeTransicionarPedido(CONFIRMADO, CANCELADO), true);
  assert.equal(puedeTransicionarPedido(EN_COCINA, CANCELADO), true);
  assert.equal(puedeTransicionarPedido(LISTO, CANCELADO), true);
  assert.equal(puedeTransicionarPedido(EN_CAMINO, CANCELADO), true);
});

test('rechaza saltos de estado y modificaciones de estados terminales', () => {
  assert.equal(puedeTransicionarPedido(ABIERTO, EN_COCINA), false);
  assert.equal(puedeTransicionarPedido(CONFIRMADO, LISTO), false);
  assert.equal(puedeTransicionarPedido(EN_COCINA, ENTREGADO), false);
  assert.equal(puedeTransicionarPedido(ENTREGADO, ABIERTO), false);
  assert.equal(puedeTransicionarPedido(CANCELADO, CONFIRMADO), false);
});
