export const openapiDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'API Pepes Pizza',
    version: '1.0.0',
    description: 'API para autenticación, productos, pedidos, mesas, caja y pagos.'
  },
  servers: [{ url: process.env.BASE_URL || 'http://localhost:5000', description: 'Servidor configurado' }],
  tags: [
    { name: 'Auth', description: 'Autenticación de usuarios' },
    { name: 'Productos', description: 'Catálogo y disponibilidad' },
    { name: 'Pedidos', description: 'Gestión de pedidos' },
    { name: 'Mesas', description: 'Gestión de mesas del salón' },
    { name: 'Caja', description: 'Apertura, cobros, movimientos y cierre de caja' },
    { name: 'Tickets', description: 'Comprobantes de venta imprimibles' }
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Datos inválidos' },
              details: { type: 'object', nullable: true }
            }
          }
        }
      },
      Producto: {
        type: 'object', required: ['categoria', 'nombre', 'precio'], properties: {
          _id: { type: 'string', readOnly: true },
          categoria: { type: 'string', enum: ['PIZZAS', 'EMPANADAS', 'BEBIDAS', 'POSTRES', 'ADICIONALES'] },
          nombre: { type: 'string', minLength: 3, maxLength: 80, example: 'Pizza Muzzarella' },
          descripcion: { type: 'string', example: 'Mozzarella y aceitunas' }, precio: { type: 'number', minimum: 0, example: 12000 },
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
      PedidoProducto: {
        type: 'object',
        required: ['nombreSnapshot', 'cantidad', 'precioUnitario', 'subtotal'],
        properties: {
          productoId: { type: 'string', nullable: true, readOnly: true },
          nombreSnapshot: { type: 'string', example: 'Pizza Muzzarella', readOnly: true },
          cantidad: { type: 'integer', minimum: 1, example: 2 },
          precioUnitario: { type: 'number', minimum: 0, example: 12000, readOnly: true },
          subtotal: { type: 'number', minimum: 0, example: 24000, readOnly: true }
        }
      },
      PagoPedido: {
        type: 'object',
        required: ['metodo', 'monto'],
        properties: {
          metodo: { type: 'string', enum: ['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO'] },
          monto: { type: 'number', minimum: 0, example: 24000 },
          usuarioId: { type: 'string', nullable: true, readOnly: true },
          cajaId: { type: 'string', nullable: true, readOnly: true },
          fecha: { type: 'string', format: 'date-time', readOnly: true },
          estado: { type: 'string', enum: ['ACTIVO', 'ANULADO'], readOnly: true }
        }
      },
      Pedido: {
        type: 'object',
        required: ['tipoPedido', 'productos', 'total', 'estadoPedido', 'estadoPago'],
        properties: {
          _id: { type: 'string', readOnly: true },
          tipoPedido: { type: 'string', enum: ['SALON', 'DELIVERY', 'TAKEAWAY'], default: 'SALON' },
          nombreCliente: { type: 'string', nullable: true },
          telefono: { type: 'string', nullable: true },
          direccion: { type: 'string', nullable: true },
          mesaId: { type: 'string', nullable: true },
          usuarioId: { type: 'string', nullable: true, readOnly: true },
          productos: { type: 'array', items: { $ref: '#/components/schemas/PedidoProducto' } },
          total: { type: 'number', minimum: 0, example: 24000, readOnly: true },
          descuento: { type: 'object', readOnly: true, properties: { porcentaje: { type: 'number', minimum: 0, maximum: 100 }, monto: { type: 'number', minimum: 0 }, aplicadoPor: { type: 'string', nullable: true }, fecha: { type: 'string', format: 'date-time', nullable: true } } },
          totalFinal: { type: 'number', minimum: 0, readOnly: true },
          pagos: { type: 'array', items: { $ref: '#/components/schemas/PagoPedido' } },
          comentario: { type: 'string', default: '' },
          estadoPedido: { type: 'string', enum: ['ABIERTO', 'CONFIRMADO', 'EN_COCINA', 'LISTO', 'SERVIDO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'], default: 'ABIERTO' },
          estadoPago: { type: 'string', enum: ['PENDIENTE', 'PAGADO', 'ANULADO'], default: 'PENDIENTE' },
          cierre: { type: 'object', readOnly: true, properties: { cerrado: { type: 'boolean' }, fecha: { type: 'string', format: 'date-time', nullable: true }, usuarioId: { type: 'string', nullable: true } } },
          fechaPedido: { type: 'string', format: 'date-time', readOnly: true },
          createdAt: { type: 'string', format: 'date-time', readOnly: true },
          updatedAt: { type: 'string', format: 'date-time', readOnly: true }
        }
      },
      PedidoCreate: {
        type: 'object',
        required: ['tipoPedido', 'productos'],
        properties: {
          tipoPedido: { type: 'string', enum: ['SALON', 'DELIVERY', 'TAKEAWAY'] },
          nombreCliente: { type: 'string' },
          telefono: { type: 'string' },
          direccion: { type: 'string' },
          comentario: { type: 'string' },
          mesaId: { type: 'string', nullable: true },
          productos: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productoId', 'cantidad'],
              properties: {
                productoId: { type: 'string' },
                cantidad: { type: 'integer', minimum: 1 }
              }
            }
          }
        }
      },
      TicketVenta: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['VENTA'] },
          version: { type: 'integer', example: 1 },
          pedidoId: { type: 'string' },
          numeroPedido: { type: 'string' },
          fechaPedido: { type: 'string', format: 'date-time' },
          fechaCierre: { type: 'string', format: 'date-time', nullable: true },
          tipoPedido: { type: 'string', enum: ['SALON', 'DELIVERY', 'TAKEAWAY'] },
          contexto: { type: 'object' },
          productos: { type: 'array', items: { type: 'object' } },
          totalOriginal: { type: 'number' },
          descuento: { type: 'object' },
          totalFinal: { type: 'number' },
          pagos: { type: 'array', items: { type: 'object' } },
          comentario: { type: 'string' }
        }
      },
      Caja: {
        type: 'object',
        properties: {
          _id: { type: 'string', readOnly: true },
          estado: { type: 'string', enum: ['ABIERTA', 'CERRADA'] },
          montoInicial: { type: 'number', minimum: 0 },
          fechaApertura: { type: 'string', format: 'date-time' },
          fechaCierre: { type: 'string', format: 'date-time', nullable: true },
          totalesPorMetodo: { type: 'object', additionalProperties: { type: 'number' } },
          efectivoEsperado: { type: 'number', nullable: true },
          efectivoDeclarado: { type: 'number', nullable: true },
          diferencia: { type: 'number', nullable: true }
        }
      },
      TokenResponse: { type: 'object', properties: { token: { type: 'string' }, rol: { type: 'string', example: 'admin' }, nombre: { type: 'string', example: 'Juan Pérez' }, id: { type: 'string' } } },
      EstadoPedido: { type: 'object', required: ['estadoPedido'], properties: { estadoPedido: { type: 'string', enum: ['ABIERTO', 'CONFIRMADO', 'EN_COCINA', 'LISTO', 'SERVIDO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'] } } },
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
