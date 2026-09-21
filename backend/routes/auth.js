import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import Usuario from '../models/Usuario.js';
import { ROLES } from '../constants/roles.js';
import { ApiError } from '../utils/apiError.js';

const router = express.Router();

// Bootstrap público: solo permite crear el primer administrador.
router.post('/register', async (req, res, next) => {
  try {
    const { nombreUsuario, password, nombre, email } = req.body;

    if (!nombreUsuario || !password || !nombre || !email) {
      throw new ApiError(400, 'nombreUsuario, password, nombre y email son obligatorios', {
        fields: ['nombreUsuario', 'password', 'nombre', 'email']
      });
    }

    const usuariosExistentes = await Usuario.exists({});
    if (usuariosExistentes) {
      throw new ApiError(403, 'El registro público está cerrado');
    }

    const nuevoUsuario = new Usuario({
      nombreUsuario,
      password,
      nombre,
      email,
      rol: ROLES.ADMIN
    });

    await nuevoUsuario.save();

    return res.status(201).json({ message: 'Usuario administrador creado con éxito' });
  } catch (error) {
    return next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { nombreUsuario, password } = req.body;

    if (!nombreUsuario || !password) {
      throw new ApiError(400, 'nombreUsuario y password son obligatorios', {
        fields: ['nombreUsuario', 'password']
      });
    }

    const usuario = await Usuario.findOne({ nombreUsuario }).select('+password');
    if (!usuario || !usuario.activo) {
      throw new ApiError(401, 'Usuario o contraseña incorrectos');
    }

    const isMatch = await usuario.matchPassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Usuario o contraseña incorrectos');
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      token,
      rol: usuario.rol,
      nombre: usuario.nombre,
      id: usuario._id
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
 */
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Crear el primer usuario administrador
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - nombreUsuario
 *               - password
 *               - email
 *             properties:
 *               nombre:
 *                 type: string
 *               nombreUsuario:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario administrador creado correctamente
 *       400:
 *         description: Datos requeridos ausentes
 *       403:
 *         description: El registro público está cerrado
 */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombreUsuario
 *               - password
 *             properties:
 *               nombreUsuario:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso con token JWT
 *       400:
 *         description: Datos requeridos ausentes
 *       401:
 *         description: Credenciales incorrectas
 */
