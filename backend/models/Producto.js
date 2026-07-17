import mongoose from 'mongoose';

const ProductoSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: true,
    enum: [
      'PIZZAS',
      'EMPANADAS',
      'BEBIDAS',
      'POSTRES',
      'ADICIONALES'
    ]
  },

  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  descripcion: {
    type: String,
    trim: true
  },

  precio: {
    type: Number,
    required: true
  },

  imagen: {
    type: String,
    trim: true
  },

  disponible: {
    type: Boolean,
    default: true
  },

  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Producto', ProductoSchema);
