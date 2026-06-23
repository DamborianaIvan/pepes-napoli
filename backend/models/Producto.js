const mongoose = require('mongoose');

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
    trim: true
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

module.exports = mongoose.model('Producto', ProductoSchema);