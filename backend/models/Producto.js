import mongoose from 'mongoose';
import { normalizarNombreCategoriaProducto } from '../utils/categoriaProducto.js';

const ProductoSchema = new mongoose.Schema({
  categoria: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 40,
    set: normalizarNombreCategoriaProducto
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
    required: true,
    min: 0
  },

  imagen: {
    type: String,
    trim: true
  },

  disponible: {
    type: Boolean,
    default: true
  },

  activo: {
    type: Boolean,
    default: true,
    index: true
  },

  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

ProductoSchema.index({ categoria: 1, nombre: 1 });

export default mongoose.model('Producto', ProductoSchema);
