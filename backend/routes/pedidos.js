const express = require('express');
const router = express.Router();

const Pedido = require('../models/Pedido');
const { protect } = require('../middleware/auth');

/**
 * Crear pedido
 */
router.post('/', protect, async (req, res) => {
  try {
    const pedidoData = {
      ...req.body,
      usuarioId: req.usuario.id
    };

    const pedido = new Pedido(pedidoData);

    await pedido.save();

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error creando pedido:', error);

    res.status(500).json({
      message: 'Error creando pedido'
    });
  }
});

/**
 * Obtener todos los pedidos
 */
router.get('/', protect, async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .sort({ fechaPedido: -1 });

    res.json(pedidos);
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);

    res.status(500).json({
      message: 'Error al obtener pedidos'
    });
  }
});

/**
 * Obtener pedido por ID
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      });
    }

    res.json(pedido);

  } catch (error) {
    console.error('Error obteniendo pedido:', error);

    res.status(500).json({
      message: 'Error al obtener pedido'
    });
  }
});

/**
 * Actualizar estado
 */
router.patch('/:id/estado', protect, async (req, res) => {
  try {

    const { estado } = req.body;

    const estadosPermitidos = [
      'ABIERTO',
      'CONFIRMADO',
      'EN_COCINA',
      'LISTO',
      'ENTREGADO',
      'PAGADO',
      'CANCELADO'
    ];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        message: 'Estado inválido'
      });
    }

    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      });
    }

    pedido.estado = estado;

    await pedido.save();

    res.json(pedido);

  } catch (error) {
    console.error('Error actualizando estado:', error);

    res.status(500).json({
      message: 'Error actualizando estado'
    });
  }
});

/**
 * Eliminar pedido
 */
router.delete('/:id', protect, async (req, res) => {
  try {

    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        message: 'Pedido no encontrado'
      });
    }

    await Pedido.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Pedido eliminado correctamente'
    });

  } catch (error) {
    console.error('Error eliminando pedido:', error);

    res.status(500).json({
      message: 'Error eliminando pedido'
    });
  }
});

module.exports = router;