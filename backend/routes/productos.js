const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { protect, restrictTo } = require('../middleware/auth');
const StockGeneral = require("../models/StockGeneral");

const multer = require('multer');

// Configuración básica para guardar archivos en disco en carpeta 'uploads/'
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // crea la carpeta uploads si no existe
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Guarda con un nombre único para evitar sobreescritura
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ✅ Crear producto (solo "admin")
router.post('/', protect, restrictTo('admin'), upload.single("image"), async (req, res) => {
  try {
    const { category, name, description, price, image, disponible } = req.body;

    const nuevoProducto = new Producto({
      category,
      name,
      description,
      price,
      image,
      disponible,
    });

    await nuevoProducto.save();
    res.status(201).json({ message: 'Producto creado correctamente', producto: nuevoProducto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el producto' });
  }
});

// ✅ Obtener todos los productos (público)
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find().lean();
    const productosConId = productos.map(p => ({
      ...p,
      id: p._id.toString(), 
    }));
    res.json(productosConId);
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
router.put('/:id', protect, restrictTo('admin'), upload.single("image"), async (req, res) => {
  try {
    const productoActualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!productoActualizado) return res.status(404).json({ message: 'Producto no encontrado' });

    res.json({ message: 'Producto actualizado correctamente', producto: productoActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el producto' });
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
/**
 * @swagger
 * tags:
 *   - name: Productos
 *     description: Gestión de productos
 *   - name: ConfiguracionGlobal
 *     description: Configuración general del stock
 *
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64ab1234cd56ef7890ab1234"
 *         category:
 *           type: string
 *           example: "Sushi"
 *         name:
 *           type: string
 *           example: "California Roll"
 *         description:
 *           type: string
 *           example: "Delicioso roll con aguacate y cangrejo"
 *         price:
 *           type: number
 *           example: 500
 *         image:
 *           type: string
 *           example: "https://tusitio.com/images/producto1.jpg"
 *         disponible:
 *           type: boolean
 *           example: true
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *           example: "2024-06-28T14:20:30.000Z"
 *     ProductoInput:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           example: "Sushi"
 *         name:
 *           type: string
 *           example: "California Roll"
 *         description:
 *           type: string
 *           example: "Delicioso roll con aguacate y cangrejo"
 *         price:
 *           type: number
 *           example: 500
 *         image:
 *           type: string
 *           description: Base64 o URL o path de imagen
 *         disponible:
 *           type: boolean
 *           example: true
 *     DisponibilidadUpdate:
 *       type: object
 *       properties:
 *         disponible:
 *           type: boolean
 *           example: false
 *     StockGeneralConfig:
 *       type: object
 *       properties:
 *         stockGeneralActivo:
 *           type: boolean
 *           example: true
 *     StockGeneralResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Stock general activado"
 *         config:
 *           $ref: '#/components/schemas/StockGeneralConfig'
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos con filtros opcionales
 *     tags: [Productos]
 *     parameters:
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por categoría (insensible a mayúsculas)
 *       - in: query
 *         name: disponible
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidad
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 *       500:
 *         description: Error al obtener productos
 *
 *   post:
 *     summary: Crear un nuevo producto (solo admin)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *               disponible:
 *                 type: boolean
 *             required:
 *               - category
 *               - name
 *               - price
 *     responses:
 *       201:
 *         description: Producto creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Producto creado correctamente"
 *                 producto:
 *                   $ref: '#/components/schemas/Producto'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al crear el producto
 */

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error al obtener el producto
 *   put:
 *     summary: Actualizar un producto (solo admin)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *               disponible:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Producto actualizado correctamente"
 *                 producto:
 *                   $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al actualizar el producto
 *   delete:
 *     summary: Eliminar un producto (solo admin)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Producto eliminado correctamente"
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al eliminar el producto
 */

/**
 * @swagger
 * /api/productos/{id}/disponible:
 *   patch:
 *     summary: Cambiar disponibilidad de un producto (solo admin)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisponibilidadUpdate'
 *     responses:
 *       200:
 *         description: Disponibilidad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Disponibilidad actualizada"
 *                 producto:
 *                   $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Bad Request - campo disponible inválido
 *       404:
 *         description: Producto no encontrado
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al actualizar disponibilidad
 */

/**
 * @swagger
 * /api/productos/configuracion/stock-general:
 *   get:
 *     summary: Obtener estado del stock general
 *     tags: [ConfiguracionGlobal]
 *     responses:
 *       200:
 *         description: Estado actual del stock general
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockGeneralConfig'
 *       500:
 *         description: Error al obtener configuración global
 *   patch:
 *     summary: Actualizar estado del stock general (solo admin)
 *     tags: [ConfiguracionGlobal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockGeneralConfig'
 *     responses:
 *       200:
 *         description: Estado actualizado del stock general
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockGeneralResponse'
 *       400:
 *         description: Bad Request - campo inválido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error al actualizar stock general
 */
