import mongoose from 'mongoose';
import {
  ESTADOS_PAGO,
  ESTADOS_PEDIDO,
  METODOS_PAGO,
  TIPOS_PEDIDO
} from '../constants/pedido.js';
import { ESTADOS_REGISTRO_PAGO } from '../constants/caja.js';

const PagoSchema = new mongoose.Schema({
  metodo: {
    type: String,
    enum: Object.values(METODOS_PAGO),
    required: true
  },
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  cajaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caja',
    default: null
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: Object.values(ESTADOS_REGISTRO_PAGO),
    default: ESTADOS_REGISTRO_PAGO.ACTIVO
  },
  anuladoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  fechaAnulacion: {
    type: Date,
    default: null
  }
});

const DescuentoSchema = new mongoose.Schema({
  porcentaje: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  monto: {
    type: Number,
    default: 0,
    min: 0
  },
  aplicadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  fecha: {
    type: Date,
    default: null
  }
}, { _id: false });

const CierrePedidoSchema = new mongoose.Schema({
  cerrado: {
    type: Boolean,
    default: false
  },
  fecha: {
    type: Date,
    default: null
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  }
}, { _id: false });

const PedidoSchema = new mongoose.Schema({
  tipoPedido: {
    type: String,
    enum: Object.values(TIPOS_PEDIDO),
    default: TIPOS_PEDIDO.SALON,
    required: true,
    index: true
  },

  nombreCliente: {
    type: String,
    trim: true,
    default: null
  },

  telefono: {
    type: String,
    trim: true,
    default: null
  },

  direccion: {
    type: String,
    trim: true,
    default: null
  },

  mesaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mesa',
    default: null,
    index: true
  },

  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null,
    index: true
  },

  productos: [
    {
      productoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        default: null
      },
      nombreSnapshot: {
        type: String,
        required: true,
        trim: true
      },
      categoriaSnapshot: {
        type: String,
        default: null,
        trim: true
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1
      },
      precioUnitario: {
        type: Number,
        required: true,
        min: 0
      },
      subtotal: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],

  total: {
    type: Number,
    required: true,
    min: 0
  },

  descuento: {
    type: DescuentoSchema,
    default: () => ({})
  },

  totalFinal: {
    type: Number,
    default: null,
    min: 0
  },

  pagos: {
    type: [PagoSchema],
    default: []
  },

  estadoPedido: {
    type: String,
    enum: Object.values(ESTADOS_PEDIDO),
    default: ESTADOS_PEDIDO.ABIERTO,
    required: true,
    index: true
  },

  estadoPago: {
    type: String,
    enum: Object.values(ESTADOS_PAGO),
    default: ESTADOS_PAGO.PENDIENTE,
    required: true,
    index: true
  },

  cierre: {
    type: CierrePedidoSchema,
    default: () => ({})
  },

  comentario: {
    type: String,
    trim: true,
    default: ''
  },

  fechaPedido: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

PedidoSchema.index({ estadoPedido: 1, fechaPedido: 1 });
PedidoSchema.index({
  estadoPago: 1,
  'cierre.cerrado': 1,
  'cierre.fecha': -1,
  estadoPedido: 1
});

export default mongoose.model('Pedido', PedidoSchema);
