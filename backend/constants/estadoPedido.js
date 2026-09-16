import { ESTADOS_PEDIDO } from './pedido.js';

const { ABIERTO, CONFIRMADO, EN_COCINA, LISTO, EN_CAMINO, ENTREGADO, CANCELADO } = ESTADOS_PEDIDO;

export const TRANSICIONES_PEDIDO = Object.freeze({
  [ABIERTO]: Object.freeze([CONFIRMADO, CANCELADO]),
  [CONFIRMADO]: Object.freeze([EN_COCINA, CANCELADO]),
  [EN_COCINA]: Object.freeze([LISTO, CANCELADO]),
  [LISTO]: Object.freeze([EN_CAMINO, ENTREGADO, CANCELADO]),
  [EN_CAMINO]: Object.freeze([ENTREGADO, CANCELADO]),
  [ENTREGADO]: Object.freeze([]),
  [CANCELADO]: Object.freeze([]),
});

export const puedeTransicionarPedido = (estadoActual, estadoNuevo) =>
  TRANSICIONES_PEDIDO[estadoActual]?.includes(estadoNuevo) ?? false;
