import express from 'express';
import { protect } from '../middleware/auth.js';
import Mesa from '../models/Mesa.js';

const router = express.Router();

/**
 * Obtener todas las mesas
 */
router.get('/', protect, async (req, res) => {
  try {

    const mesas = await Mesa.find()
      .sort({ numero: 1 });

    res.json(mesas);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error obteniendo mesas'
    });

  }
});

/**
 * Obtener mesa por ID
 */
router.get('/:id', protect, async (req, res) => {
  try {

    const mesa = await Mesa.findById(req.params.id);

    if (!mesa) {
      return res.status(404).json({
        message: 'Mesa no encontrada'
      });
    }

    res.json(mesa);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error obteniendo mesa'
    });

  }
});

/**
 * Crear mesa
 */
router.post('/', protect, async (req, res) => {
  try {

    const {
      numero,
      nombre,
      capacidad,
      observaciones
    } = req.body;

    const existeMesa = await Mesa.findOne({
      numero
    });

    if (existeMesa) {
      return res.status(400).json({
        message: 'Ya existe una mesa con ese número'
      });
    }

    const mesa = new Mesa({
      numero,
      nombre,
      capacidad,
      observaciones
    });

    await mesa.save();

    res.status(201).json(mesa);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error creando mesa'
    });

  }
});

/**
 * Editar mesa
 */
router.put('/:id', protect, async (req, res) => {
  try {

    const mesa = await Mesa.findById(req.params.id);

    if (!mesa) {
      return res.status(404).json({
        message: 'Mesa no encontrada'
      });
    }

    mesa.numero = req.body.numero ?? mesa.numero;
    mesa.nombre = req.body.nombre ?? mesa.nombre;
    mesa.capacidad = req.body.capacidad ?? mesa.capacidad;
    mesa.estado = req.body.estado ?? mesa.estado;
    mesa.observaciones =
      req.body.observaciones ?? mesa.observaciones;

    await mesa.save();

    res.json(mesa);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error actualizando mesa'
    });

  }
});

router.patch('/:id/estado', protect, async (req, res) => {
    try {
      const { estado } = req.body;
      const mesa =
        await Mesa.findById(
          req.params.id
        );
      if (!mesa) {
        return res
          .status(404)
          .json({
            message:
              'Mesa no encontrada'
          });
      }
      mesa.estado = estado;
      await mesa.save();
      res.json({
        message:
          'Estado actualizado correctamente',
        mesa
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message:
          'Error actualizando estado'
      });
    }
  }
);
/**
 * Eliminar mesa
 */
router.delete('/:id', protect, async (req, res) => {
  try {

    const mesa = await Mesa.findById(req.params.id);

    if (!mesa) {
      return res.status(404).json({
        message: 'Mesa no encontrada'
      });
    }

    await Mesa.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Mesa eliminada correctamente'
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: 'Error eliminando mesa'
    });

  }
});

export default router;

/**
 * @swagger
 * /api/mesas:
 *   get:
 *     summary: Obtener todas las mesas
 *     tags:
 *       - Mesas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mesas
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/mesas/{id}:
 *   get:
 *     summary: Obtener una mesa por ID
 *     tags:
 *       - Mesas
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
 *         description: Mesa encontrada
 *       404:
 *         description: Mesa no encontrada
 */

/**
 * @swagger
 * /api/mesas:
 *   post:
 *     summary: Crear nueva mesa
 *     tags:
 *       - Mesas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numero
 *             properties:
 *               numero:
 *                 type: number
 *                 example: 1
 *               nombre:
 *                 type: string
 *                 example: Mesa 1
 *               capacidad:
 *                 type: number
 *                 example: 4
 *               observaciones:
 *                 type: string
 *                 example: Cerca de la ventana
 *     responses:
 *       201:
 *         description: Mesa creada correctamente
 *       400:
 *         description: Ya existe una mesa con ese número
 */

/**
 * @swagger
 * /api/mesas/{id}:
 *   put:
 *     summary: Actualizar mesa
 *     tags:
 *       - Mesas
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: number
 *               nombre:
 *                 type: string
 *               capacidad:
 *                 type: number
 *               estado:
 *                 type: string
 *                 enum:
 *                   - LIBRE
 *                   - OCUPADA
 *                   - CUENTA_SOLICITADA
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mesa actualizada correctamente
 *       404:
 *         description: Mesa no encontrada
 */

/**
 * @swagger
 * /api/mesas/{id}:
 *   delete:
 *     summary: Eliminar mesa
 *     tags:
 *       - Mesas
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
 *         description: Mesa eliminada correctamente
 *       404:
 *         description: Mesa no encontrada
 */
