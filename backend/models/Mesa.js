import mongoose from 'mongoose';

const MesaSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true,
    unique: true
  },

  nombre: {
    type: String,
    default: null
  },

  capacidad: {
    type: Number,
    default: 4
  },

  estado: {
    type: String,
    enum: [
      'LIBRE',
      'OCUPADA'
    ],
    default: 'LIBRE'
  },

  activa: {
    type: Boolean,
    default: true
  },

  observaciones: {
    type: String,
    default: ''
  }

}, {
  timestamps: true
});

export default mongoose.model('Mesa', MesaSchema);
