import express from 'express';
import mongoose from 'mongoose';
import { protect, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../constants/permissions.js';
import { ROLES_VALUES, ROLES } from '../constants/roles.js';
import Usuario from '../models/Usuario.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

const usuarioPublico = (usuario) => ({
  _id: usuario._id,
  nombre: usuario.nombre,
  nombreUsuario: usuario.nombreUsuario,
  email: usuario.email,
  rol: usuario.rol,
  activo: usuario.activo,
  fechaCreacion: usuario.fechaCreacion
});

const validarRol = (rol) => {
  if (!ROLES_VALUES.includes(rol)) {
    throw new ApiError(400, 'rol inválido', {
      field: 'rol',
      allowedValues: ROLES_VALUES
    });
  }
};

const validarPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) {
    throw new ApiError(400, 'La contraseña debe tener al menos 8 caracteres', {
      field: 'password'
    });
  }
};

router.use(protect, requirePermission(PERMISSIONS.USERS_MANAGE));

router.get('/', asyncHandler(async (req, res) => {
  const usuarios = await Usuario.find().sort({ fechaCreacion: -1 });
  return res.json(usuarios.map(usuarioPublico));
}));

router.post('/', asyncHandler(async (req, res) => {
  const { nombre, nombreUsuario, email, password, rol } = req.body;

  if (!nombre || !nombreUsuario || !email || !password || !rol) {
    throw new ApiError(400, 'nombre, nombreUsuario, email, password y rol son obligatorios', {
      fields: ['nombre', 'nombreUsuario', 'email', 'password', 'rol']
    });
  }

  validarRol(rol);
  validarPassword(password);

  const usuario = await Usuario.create({
    nombre,
    nombreUsuario,
    email,
    password,
    rol,
    activo: true
  });

  return res.status(201).json(usuarioPublico(usuario));
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Identificador de usuario inválido');
  }

  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');

  const { nombre, nombreUsuario, email, rol } = req.body;

  if (rol !== undefined) {
    validarRol(rol);

    if (usuario._id.toString() === req.usuario.id && rol !== usuario.rol) {
      throw new ApiError(403, 'No puede cambiar su propio rol');
    }

    if (usuario.rol === ROLES.ADMIN && rol !== ROLES.ADMIN && usuario.activo) {
      const adminsActivos = await Usuario.countDocuments({
        rol: ROLES.ADMIN,
        activo: true,
        _id: { $ne: usuario._id }
      });

      if (adminsActivos === 0) {
        throw new ApiError(409, 'Debe existir al menos un administrador activo');
      }
    }

    usuario.rol = rol;
  }

  if (nombre !== undefined) usuario.nombre = nombre;
  if (nombreUsuario !== undefined) usuario.nombreUsuario = nombreUsuario;
  if (email !== undefined) usuario.email = email;

  await usuario.save();
  return res.json(usuarioPublico(usuario));
}));

router.patch('/:id/estado', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Identificador de usuario inválido');
  }

  const { activo } = req.body;
  if (typeof activo !== 'boolean') {
    throw new ApiError(400, 'activo debe ser booleano', { field: 'activo' });
  }

  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');

  if (usuario._id.toString() === req.usuario.id && !activo) {
    throw new ApiError(403, 'No puede desactivar su propio usuario');
  }

  if (usuario.activo && !activo && usuario.rol === ROLES.ADMIN) {
    const adminsActivos = await Usuario.countDocuments({
      rol: ROLES.ADMIN,
      activo: true,
      _id: { $ne: usuario._id }
    });

    if (adminsActivos === 0) {
      throw new ApiError(409, 'Debe existir al menos un administrador activo');
    }
  }

  usuario.activo = activo;
  await usuario.save();

  return res.json(usuarioPublico(usuario));
}));

router.patch('/:id/password', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Identificador de usuario inválido');
  }

  const { password } = req.body;
  validarPassword(password);

  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) throw new ApiError(404, 'Usuario no encontrado');

  usuario.password = password;
  await usuario.save();

  return res.json({ message: 'Contraseña actualizada correctamente' });
}));

export default router;
