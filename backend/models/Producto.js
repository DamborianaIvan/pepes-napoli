const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descrripcion: {
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
  }, 
});

module.exports = mongoose.model('Producto', ProductoSchema);
