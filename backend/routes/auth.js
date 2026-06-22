const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Registro
router.post('/register', async (req, res) => {
  const { nombreUsuario, password, nombre, rol, email } = req.body;
    console.log(req.body) 
  try {
    const existingUser = await Usuario.findOne({ nombreUsuario });
    if (existingUser) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }

    const nuevoUsuario = new Usuario({ nombreUsuario, password, nombre, rol, email });
    await nuevoUsuario.save();

    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar el usuario' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { nombreUsuario, password } = req.body;
  try {
    const usuario = await Usuario.findOne({ nombreUsuario });
    if (!usuario) {
      return res.status(400).json({
      message: 'Usuario o contraseña incorrectos'
    });
    }

    const isMatch = await usuario.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ Asegurate de devolver también el rol
    res.json({
      token,
      rol: usuario.rol,
      nombre: usuario.nombre, // opcional: podés usarlo en Sidebar
      id: usuario._id, // si lo necesitás para frontend
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en login' });
  }
});

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación de usuarios
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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso con token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Email o contraseña incorrectos
 *       500:
 *         description: Error en el servidor
 */