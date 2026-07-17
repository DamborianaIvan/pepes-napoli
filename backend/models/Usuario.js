import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  nombreUsuario: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Hash password antes de guardar
UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Método para verificar password
UsuarioSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model('Usuario', UsuarioSchema);
