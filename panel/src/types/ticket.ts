import type { MetodoPago, TipoPedido } from "./pedido";

export interface TicketContexto {
  mesa: {
    id: string | null;
    numero: number;
    nombre: string | null;
  } | null;
  nombreCliente: string | null;
  telefono: string | null;
  direccion: string | null;
}

export interface TicketProductoCocina {
  nombre: string;
  cantidad: number;
}

export interface TicketProductoVenta extends TicketProductoCocina {
  precioUnitario: number;
  subtotal: number;
}

export interface TicketCocina {
  tipo: "COCINA";
  version: number;
  pedidoId: string | null;
  numeroPedido: string;
  fechaPedido: string;
  tipoPedido: TipoPedido;
  contexto: TicketContexto;
  productos: TicketProductoCocina[];
  comentario: string;
}

export interface TicketVenta {
  tipo: "VENTA";
  version: number;
  pedidoId: string | null;
  numeroPedido: string;
  fechaPedido: string;
  fechaCierre: string | null;
  tipoPedido: TipoPedido;
  contexto: TicketContexto;
  productos: TicketProductoVenta[];
  totalOriginal: number;
  descuento: {
    porcentaje: number;
    monto: number;
  };
  totalFinal: number;
  pagos: {
    metodo: MetodoPago;
    monto: number;
  }[];
  comentario: string;
}
