/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Producto:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *
 *         categoria:
 *           type: string
 *           example: PIZZAS
 *
 *         nombre:
 *           type: string
 *           example: Pizza Muzzarella
 *
 *         descripcion:
 *           type: string
 *           example: Mozzarella y aceitunas
 *
 *         precio:
 *           type: number
 *           example: 12000
 *
 *         imagen:
 *           type: string
 *           example: ""
 *
 *         disponible:
 *           type: boolean
 *           example: true
 */
const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { protect, restrictTo } = require('../middleware/auth');
const StockGeneral = require("../models/StockGeneral");

// ✅ Crear producto (solo "admin")
/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear producto
 *     tags:
 *       - Productos
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Producto'
 *
 *     responses:
 *       201:
 *         description: Producto creado
 */
router.post('/', protect, restrictTo('admin'), async (req, res) => {
  try {

    const {
      categoria,
      nombre,
      descripcion,
      precio,
      imagen,
      disponible
    } = req.body;

    // Validar obligatorios

    if (!categoria || !nombre || precio === undefined) {
      return res.status(400).json({
        message: 'Categoria, nombre y precio son obligatorios'
      });
    }

    // Validar categorias

    const categoriasValidas = [
      'PIZZAS',
      'EMPANADAS',
      'BEBIDAS',
      'POSTRES',
      'ADICIONALES'
    ];

    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({
        message: 'Categoria invalida'
      });
    }

    // Validar nombre

    const nombreLimpio = nombre.trim();

    if (nombreLimpio.length < 3) {
      return res.status(400).json({
        message: 'El nombre debe tener al menos 3 caracteres'
      });
    }

    if (nombreLimpio.length > 80) {
      return res.status(400).json({
        message: 'El nombre es demasiado largo'
      });
    }

    // Validar precio

    if (isNaN(precio)) {
      return res.status(400).json({
        message: 'Precio invalido'
      });
    }

    if (Number(precio) <= 0) {
      return res.status(400).json({
        message: 'El precio debe ser mayor a 0'
      });
    }

    // Verificar duplicado

    const productoExistente = await Producto.findOne({
      nombre: {
        $regex: new RegExp(
          `^${nombreLimpio}$`,
          'i'
        )
      }
    });

    if (productoExistente) {
      return res.status(409).json({
        message: 'Ya existe un producto con ese nombre'
      });
    }

    const nuevoProducto = new Producto({
      categoria,
      nombre: nombreLimpio,
      descripcion,
      precio: Number(precio),
      imagen,
      disponible
    });

    await nuevoProducto.save();

    res.status(201).json({
      message: 'Producto creado correctamente',
      producto: nuevoProducto
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error al crear el producto'
    });

  }
});

// ✅ Obtener todos los productos (público)
/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos
 *     tags:
 *       - Productos
 *
 *     responses:
 *       200:
 *         description: Lista de productos
 */
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find()
      .sort({
        categoria: 1,
        nombre: 1
      });

    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos" });
  }
});

// ✅ Obtener un producto por ID (público)
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
});

// ✅ Actualizar producto (solo "admin")
router.put('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {

    const {
      categoria,
      nombre,
      descripcion,
      precio,
      imagen,
      disponible
    } = req.body;

    const productoActualizado =
      await Producto.findByIdAndUpdate(
        req.params.id,
        {
          categoria,
          nombre: nombre?.trim(),
          descripcion,
          precio,
          imagen,
          disponible
        },
        {
          new: true,
          runValidators: true
        }
      );

    if (!productoActualizado) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    res.json({
      message: 'Producto actualizado correctamente',
      producto: productoActualizado
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error al actualizar el producto'
    });
 
  }
});

// ✅ Eliminar producto (solo "admin")
router.delete('/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!productoEliminado) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto' });
  }
});

// ✅ Cambiar disponibilidad de un producto (individual)
router.patch('/:id/disponible', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { disponible } = req.body;
    if (typeof disponible !== "boolean") {
      return res.status(400).json({ message: 'Se espera el campo "disponible" como booleano' });
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { disponible },
      { new: true, runValidators: true }
    );

    if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json({ message: 'Disponibilidad actualizada', producto });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar disponibilidad' });
  }
});

// ✅ Obtener estado de stock general
router.get('/configuracion/stock-general', async (req, res) => {
  try {
    let config = await StockGeneral.findOne();
    if (!config) {
      config = await StockGeneral.create({ stockGeneralActivo: true });
    }
    res.json({ stockGeneralActivo: config.stockGeneralActivo });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener configuración global' });
  }
});

// ✅ Actualizar stock general (activar / desactivar todos)
router.patch('/configuracion/stock-general', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { stockGeneralActivo } = req.body;
    if (typeof stockGeneralActivo !== "boolean") {
      return res.status(400).json({ message: 'Se espera el campo "stockGeneralActivo" como booleano' });
    }

    let config = await StockGeneral.findOne();
    if (!config) {
      config = new StockGeneral({ stockGeneralActivo });
    } else {
      config.stockGeneralActivo = stockGeneralActivo;
    }

    await config.save();

    res.json({ message: `Stock general ${stockGeneralActivo ? 'activado' : 'desactivado'}`, config });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el estado de stock general' });
  }
});


module.exports = router;
