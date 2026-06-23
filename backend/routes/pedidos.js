const express = require('express');
const router = express.Router();

const Pedido = require('../models/Pedido');
const Mesa = require('../models/Mesa');
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

    if (
      pedidoData.tipoPedido === 'SALON' &&
      pedidoData.mesaId
    ) {

      const mesa = await Mesa.findById(
        pedidoData.mesaId
      );

      if (!mesa) {
        return res.status(404).json({
          message: 'Mesa no encontrada'
        });
      }

      if (mesa.estado !== 'LIBRE') {
        return res.status(400).json({
          message: 'La mesa ya está ocupada'
        });
      }
    }
    const pedido = new Pedido(pedidoData);

    await pedido.save();
    if (
      pedido.tipoPedido === 'SALON' &&
      pedido.mesaId
    ) {
      await Mesa.findByIdAndUpdate(
        pedido.mesaId,
        {
          estado: 'OCUPADA'
        }
      );
    }
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
      'EN_CAMINO',
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

    const estadoAnterior = pedido.estado;
    pedido.estado = estado;

    await pedido.save();

    if (
      estadoAnterior !== 'PAGADO' &&
      estado === 'PAGADO' &&
      pedido.mesaId
    ) {
      await Mesa.findByIdAndUpdate(
        pedido.mesaId,
        {
          estado: 'LIBRE'
        }
      );
    }

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