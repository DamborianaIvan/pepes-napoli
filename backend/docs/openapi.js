export const openapiDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'API Pepes Pizza',
    version: '1.0.0',
    description: 'API para autenticación, productos, pedidos y mesas.'
  },
  servers: [{ url: process.env.BASE_URL || 'http://localhost:5000', description: 'Servidor configurado' }],
  tags: [
    { name: 'Auth', description: 'Autenticación de usuarios' },
    { name: 'Productos', description: 'Catálogo y disponibilidad' },
    { name: 'Pedidos', description: 'Gestión de pedidos' },
    { name: 'Mesas', description: 'Gestión de mesas del salón' }
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', required: ['message'], properties: { message: { type: 'string', example: 'Descripción del error' } } },
      Producto: {
        type: 'object', required: ['categoria', 'nombre', 'precio'], properties: {
          _id: { type: 'string', readOnly: true },
          categoria: { type: 'string', enum: ['PIZZAS', 'EMPANADAS', 'BEBIDAS', 'POSTRES', 'ADICIONALES'] },
          nombre: { type: 'string', minLength: 3, maxLength: 80, example: 'Pizza Muzzarella' },
          descripcion: { type: 'string', example: 'Mozzarella y aceitunas' }, precio: { type: 'number', minimum: 0.01, example: 12000 },
          imagen: { type: 'string', example: '' }, disponible: { type: 'boolean', default: true }
        }
      },
      Mesa: {
        type: 'object', required: ['numero'], properties: {
          _id: { type: 'string', readOnly: true }, numero: { type: 'number', example: 1 },
          nombre: { type: 'string', nullable: true, example: 'Mesa ventana' }, capacidad: { type: 'number', default: 4, example: 4 },
          estado: { type: 'string', enum: ['LIBRE', 'OCUPADA'], default: 'LIBRE' }, activa: { type: 'boolean', default: true },
          observaciones: { type: 'string', example: 'Cerca de la ventana' }, createdAt: { type: 'string', format: 'date-time', readOnly: true }, updatedAt: { type: 'string', format: 'date-time', readOnly: true }
        }
      },
      PedidoProducto: { type: 'object', required: ['producto', 'cantidad', 'precio'], properties: { producto: { type: 'string', example: 'Pizza Muzzarella' }, cantidad: { type: 'number', example: 2 }, precio: { type: 'number', example: 12000 } } },
      Pedido: {
        type: 'object', required: ['tipoPedido', 'productos', 'total'], properties: {
          _id: { type: 'string', readOnly: true }, tipoPedido: { type: 'string', enum: ['SALON', 'DELIVERY', 'TAKEAWAY'], default: 'SALON' },
          nombreCliente: { type: 'string', nullable: true }, telefono: { type: 'string', nullable: true }, direccion: { type: 'string', nullable: true }, mesaId: { type: 'string', nullable: true }, usuarioId: { type: 'string', readOnly: true },
          productos: { type: 'array', items: { $ref: '#/components/schemas/PedidoProducto' } }, total: { type: 'number', example: 24000 },
          metodoPago: { type: 'string', enum: ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'], default: 'EFECTIVO' }, comentario: { type: 'string', default: '' },
          estado: { type: 'string', enum: ['ABIERTO', 'CONFIRMADO', 'EN_COCINA', 'LISTO', 'ENTREGADO', 'PAGADO', 'EN_CAMINO', 'CANCELADO'], default: 'ABIERTO' }, fechaPedido: { type: 'string', format: 'date-time', readOnly: true }
        }
      },
      TokenResponse: { type: 'object', properties: { token: { type: 'string' }, rol: { type: 'string', example: 'admin' }, nombre: { type: 'string', example: 'Juan Pérez' }, id: { type: 'string' } } },
      EstadoPedido: { type: 'object', required: ['estado'], properties: { estado: { type: 'string', enum: ['ABIERTO', 'CONFIRMADO', 'EN_COCINA', 'LISTO', 'ENTREGADO', 'PAGADO', 'EN_CAMINO', 'CANCELADO'] } } },
      EstadoMesa: { type: 'object', required: ['estado'], properties: { estado: { type: 'string', enum: ['LIBRE', 'OCUPADA'] } } },
      StockGeneral: { type: 'object', required: ['stockGeneralActivo'], properties: { stockGeneralActivo: { type: 'boolean', default: true } } }
    },
    responses: {
      Unauthorized: { description: 'Token ausente, inválido o vencido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      Forbidden: { description: 'El usuario no tiene permisos', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      NotFound: { description: 'Recurso no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
    }
  }
};
