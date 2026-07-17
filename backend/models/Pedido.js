import mongoose from 'mongoose';

const PedidoSchema = new mongoose.Schema({

  // Tipo de pedido
  tipoPedido: {
    type: String,
    enum: ['SALON', 'DELIVERY', 'TAKEAWAY'],
    default: 'SALON',
    required: true
  },

  // Datos cliente
  nombreCliente: {
    type: String,
    default: null
  },

  telefono: {
    type: String,
    default: null
  },

  direccion: {
    type: String,
    default: null
  },

  // Mesa (solo para salón)
  mesaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mesa',
    default: null
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    default: null
  },
  productos: [
    {
      producto: {
        type: String,
        required: true
      },

      cantidad: {
        type: Number,
        required: true
      },

      precio: {
        type: Number,
        required: true
      }
    }
  ],

  total: {
    type: Number,
    required: true
  },

  metodoPago: {
    type: String,
    enum: [
      'EFECTIVO',
      'TRANSFERENCIA',
      'DEBITO',
      'CREDITO'
    ],
    default: 'EFECTIVO'
  },

  comentario: {
    type: String,
    default: ''
  },

  estado: {
    type: String,
    enum: [
      'ABIERTO',
      'CONFIRMADO',
      'EN_COCINA',
      'LISTO',
      'ENTREGADO',
      'PAGADO',
      'EN_CAMINO',
      'CANCELADO'
    ],
    default: 'ABIERTO',
    index: true
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
