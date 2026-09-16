import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import Usuario from '../models/Usuario.js';
import { ApiError } from '../utils/apiError.js';

const router = express.Router();

// Registro
router.post('/register', async (req, res, next) => {
  try {
    const { nombreUsuario, password, nombre, rol, email } = req.body;

    if (!nombreUsuario || !password || !nombre) {
      throw new ApiError(400, 'nombreUsuario, password y nombre son obligatorios', {
        fields: ['nombreUsuario', 'password', 'nombre']
      });
    }

    const existingUser = await Usuario.findOne({ nombreUsuario });
    if (existingUser) {
      throw new ApiError(409, 'El nombre de usuario ya está en uso', {
        field: 'nombreUsuario'
      });
    }

    const nuevoUsuario = new Usuario({ nombreUsuario, password, nombre, rol, email });
    await nuevoUsuario.save();

    return res.status(201).json({ message: 'Usuario creado con éxito' });
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
    if (!usuario) {
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
 *     summary: Crear nuevo usuario
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
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Perez
 *               nombreUsuario:
 *                 type: string
 *                 example: juan
 *               email:
 *                 type: string
 *                 example: juan@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               rol:
 *                 type: string
 *                 enum:
 *                   - admin
 *                   - caja
 *                   - cocina
 *                   - mozo
 *                 example: mozo
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       400:
 *         description: Datos requeridos ausentes
 *       409:
 *         description: Usuario ya existe
 *       500:
 *         description: Error interno del servidor
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
 *       500:
 *         description: Error en el servidor
 */
