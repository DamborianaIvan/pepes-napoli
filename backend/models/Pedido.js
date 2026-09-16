import mongoose from 'mongoose';
import {
  ESTADOS_PAGO,
  ESTADOS_PEDIDO,
  METODOS_PAGO,
  TIPOS_PEDIDO
} from '../constants/pedido.js';

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

  pagos: [
    {
      metodo: {
        type: String,
        enum: Object.values(METODOS_PAGO),
        required: true
      },
      monto: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],

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

export default mongoose.model('Pedido', PedidoSchema);
