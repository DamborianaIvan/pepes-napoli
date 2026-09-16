import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import Mesa from '../models/Mesa.js';

const router = express.Router();
const ROLES_GESTION_MESAS = [ROLES.ADMIN, ROLES.CAJERO];

router.get('/', protect, async (req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });
    res.json(mesas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo mesas' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const mesa = await Mesa.findById(req.params.id);
    if (!mesa) return res.status(404).json({ message: 'Mesa no encontrada' });
    res.json(mesa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo mesa' });
  }
});

// Crear mesa: ADMIN o CAJERO.
router.post('/', protect, restrictTo(...ROLES_GESTION_MESAS), async (req, res) => {
  try {
    const { numero, nombre, capacidad, observaciones } = req.body;
    const existeMesa = await Mesa.findOne({ numero });

    if (existeMesa) {
      return res.status(400).json({ message: 'Ya existe una mesa con ese número' });
    }

    const mesa = new Mesa({ numero, nombre, capacidad, observaciones });
    await mesa.save();
    res.status(201).json(mesa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando mesa' });
  }
});

// Editar datos de mesa: ADMIN o CAJERO.
router.put('/:id', protect, restrictTo(...ROLES_GESTION_MESAS), async (req, res) => {
  try {
    const mesa = await Mesa.findById(req.params.id);
    if (!mesa) return res.status(404).json({ message: 'Mesa no encontrada' });

    mesa.numero = req.body.numero ?? mesa.numero;
    mesa.nombre = req.body.nombre ?? mesa.nombre;
    mesa.capacidad = req.body.capacidad ?? mesa.capacidad;
    mesa.estado = req.body.estado ?? mesa.estado;
    mesa.observaciones = req.body.observaciones ?? mesa.observaciones;

    await mesa.save();
    res.json(mesa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error actualizando mesa' });
  }
});

// Cambiar estado de mesa: ADMIN o CAJERO.
router.patch('/:id/estado', protect, restrictTo(...ROLES_GESTION_MESAS), async (req, res) => {
  try {
    const { estado } = req.body;
    const mesa = await Mesa.findById(req.params.id);
    if (!mesa) return res.status(404).json({ message: 'Mesa no encontrada' });

    mesa.estado = estado;
    await mesa.save();
    res.json({ message: 'Estado actualizado correctamente', mesa });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error actualizando estado' });
  }
});

// Eliminar mesa: solo ADMIN.
router.delete('/:id', protect, restrictTo(ROLES.ADMIN), async (req, res) => {
  try {
    const mesa = await Mesa.findById(req.params.id);
    if (!mesa) return res.status(404).json({ message: 'Mesa no encontrada' });

    await Mesa.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mesa eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error eliminando mesa' });
  }
});

export default router;
