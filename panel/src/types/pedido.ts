export const TIPOS_PEDIDO = ['SALON', 'DELIVERY', 'TAKEAWAY'] as const;
export type TipoPedido = (typeof TIPOS_PEDIDO)[number];

export const ESTADOS_PEDIDO = [
  'ABIERTO',
  'CONFIRMADO',
  'EN_COCINA',
  'LISTO',
  'SERVIDO',
  'EN_CAMINO',
  'ENTREGADO',
  'CANCELADO',
] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const ESTADOS_PAGO = ['PENDIENTE', 'PARCIAL', 'PAGADO', 'ANULADO'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export interface ProductoPedido {
  productoId: string | null;
  nombreSnapshot: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  _id: string;
  nombreCliente: string | null;
  telefono: string | null;
  direccion: string | null;
  productos: ProductoPedido[];
  total: number;
  estadoPedido: EstadoPedido;
  estadoPago: EstadoPago;
  fechaPedido: string;
  usuarioId: string | null;
  mesaId: string | null;
  pagos: { metodo: MetodoPago; monto: number }[];
  tipoPedido: TipoPedido;
  comentario?: string;
}

export const ETIQUETAS_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  ABIERTO: 'Abierto',
  CONFIRMADO: 'Confirmado',
  EN_COCINA: 'En cocina',
  LISTO: 'Listo',
  SERVIDO: 'Servido',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const ETIQUETAS_TIPO_PEDIDO: Record<TipoPedido, string> = {
  SALON: 'Salón',
  DELIVERY: 'Delivery',
  TAKEAWAY: 'Takeaway',
};

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
};
