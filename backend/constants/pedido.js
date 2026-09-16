export const TIPOS_PEDIDO = Object.freeze({
  SALON: 'SALON',
  DELIVERY: 'DELIVERY',
  TAKEAWAY: 'TAKEAWAY'
});

export const ESTADOS_PEDIDO = Object.freeze({
  ABIERTO: 'ABIERTO',
  CONFIRMADO: 'CONFIRMADO',
  EN_COCINA: 'EN_COCINA',
  LISTO: 'LISTO',
  EN_CAMINO: 'EN_CAMINO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO'
});

export const ESTADOS_PAGO = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  PARCIAL: 'PARCIAL',
  PAGADO: 'PAGADO',
  ANULADO: 'ANULADO'
});

export const METODOS_PAGO = Object.freeze({
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  DEBITO: 'DEBITO',
  CREDITO: 'CREDITO'
});

export const isEnumValue = (value, enumObject) =>
  Object.values(enumObject).includes(value);
