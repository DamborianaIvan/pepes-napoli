const json = (schema) => ({ 'application/json': { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const auth = [{ bearerAuth: [] }];
const id = { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ID MongoDB' };
const error = (description) => ({ description, content: json(ref('Error')) });
const secured = (responses) => ({ 401: { $ref: '#/components/responses/Unauthorized' }, ...responses });

export const paths = {
  '/api/usuarios': {
    get: { tags: ['Usuarios'], summary: 'Listar usuarios', security: auth, responses: secured({ 200: { description: 'Lista de usuarios', content: json({ type: 'array', items: { type: 'object' } }) }, 403: { $ref: '#/components/responses/Forbidden' } }) },
    post: { tags: ['Usuarios'], summary: 'Crear usuario', security: auth, requestBody: { required: true, content: json({ type: 'object', required: ['nombre', 'nombreUsuario', 'email', 'password', 'rol'], properties: { nombre: { type: 'string' }, nombreUsuario: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' }, rol: { type: 'string', enum: ['ADMIN', 'CAJERO', 'CHEF', 'DELIVERY'] } } }) }, responses: secured({ 201: { description: 'Usuario creado' }, 400: error('Datos inválidos'), 409: error('Usuario duplicado') }) }
  },
  '/api/usuarios/{id}': {
    patch: { tags: ['Usuarios'], summary: 'Editar usuario o rol', security: auth, parameters: [id], requestBody: { required: true, content: json({ type: 'object' }) }, responses: secured({ 200: { description: 'Usuario actualizado' }, 400: error('Datos inválidos'), 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' }, 409: error('Operación no permitida') }) }
  },
  '/api/usuarios/{id}/estado': {
    patch: { tags: ['Usuarios'], summary: 'Activar o desactivar usuario', security: auth, parameters: [id], requestBody: { required: true, content: json({ type: 'object', required: ['activo'], properties: { activo: { type: 'boolean' } } }) }, responses: secured({ 200: { description: 'Estado actualizado' }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' }, 409: error('Operación no permitida') }) }
  },
  '/api/usuarios/{id}/password': {
    patch: { tags: ['Usuarios'], summary: 'Cambiar contraseña', security: auth, parameters: [id], requestBody: { required: true, content: json({ type: 'object', required: ['password'], properties: { password: { type: 'string', format: 'password' } } }) }, responses: secured({ 200: { description: 'Contraseña actualizada' }, 400: error('Contraseña inválida'), 404: { $ref: '#/components/responses/NotFound' } }) }
  },

  '/api/auth/register': { post: { tags: ['Auth'], summary: 'Registrar usuario', requestBody: { required: true, content: json({ type: 'object', required: ['nombre', 'nombreUsuario', 'email', 'password'], properties: { nombre: { type: 'string' }, nombreUsuario: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' }, rol: { type: 'string', enum: ['admin'] } } }) }, responses: { 201: { description: 'Usuario creado', content: json({ type: 'object', properties: { message: { type: 'string' } } }) }, 400: error('Nombre de usuario en uso'), 500: error('Error interno') } } },
  '/api/auth/login': { post: { tags: ['Auth'], summary: 'Iniciar sesión', requestBody: { required: true, content: json({ type: 'object', required: ['nombreUsuario', 'password'], properties: { nombreUsuario: { type: 'string' }, password: { type: 'string', format: 'password' } } }) }, responses: { 200: { description: 'JWT emitido', content: json(ref('TokenResponse')) }, 400: error('Credenciales incorrectas'), 500: error('Error interno') } } },
  '/api/productos': {
    get: { tags: ['Productos'], summary: 'Listar productos', responses: { 200: { description: 'Lista de productos', content: json({ type: 'array', items: ref('Producto') }) }, 500: error('Error interno') } },
    post: { tags: ['Productos'], summary: 'Crear producto', security: auth, requestBody: { required: true, content: json(ref('Producto')) }, responses: secured({ 201: { description: 'Producto creado', content: json({ type: 'object', properties: { message: { type: 'string' }, producto: ref('Producto') } }) }, 400: error('Datos inválidos'), 403: { $ref: '#/components/responses/Forbidden' }, 409: error('Producto duplicado'), 500: error('Error interno') }) }
  },
  '/api/productos/{id}': {
    get: { tags: ['Productos'], summary: 'Obtener producto', parameters: [id], responses: { 200: { description: 'Producto', content: json(ref('Producto')) }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') } },
    put: { tags: ['Productos'], summary: 'Actualizar producto', security: auth, parameters: [id], requestBody: { required: true, content: json(ref('Producto')) }, responses: secured({ 200: { description: 'Producto actualizado', content: json({ type: 'object', properties: { message: { type: 'string' }, producto: ref('Producto') } }) }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) },
    delete: { tags: ['Productos'], summary: 'Eliminar producto', security: auth, parameters: [id], responses: secured({ 200: { description: 'Producto eliminado', content: json({ type: 'object', properties: { message: { type: 'string' } } }) }, 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) }
  },
  '/api/productos/{id}/disponible': { patch: { tags: ['Productos'], summary: 'Cambiar disponibilidad', security: auth, parameters: [id], requestBody: { required: true, content: json({ type: 'object', required: ['disponible'], properties: { disponible: { type: 'boolean' } } }) }, responses: secured({ 200: { description: 'Disponibilidad actualizada', content: json({ type: 'object', properties: { message: { type: 'string' }, producto: ref('Producto') } }) }, 400: error('Valor inválido'), 403: { $ref: '#/components/responses/Forbidden' }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) } },
  '/api/productos/configuracion/stock-general': { get: { tags: ['Productos'], summary: 'Obtener stock general', responses: { 200: { description: 'Estado global', content: json(ref('StockGeneral')) }, 500: error('Error interno') } }, patch: { tags: ['Productos'], summary: 'Actualizar stock general', security: auth, requestBody: { required: true, content: json(ref('StockGeneral')) }, responses: secured({ 200: { description: 'Estado actualizado', content: json({ type: 'object', properties: { message: { type: 'string' }, config: ref('StockGeneral') } }) }, 400: error('Valor inválido'), 403: { $ref: '#/components/responses/Forbidden' }, 500: error('Error interno') }) } },
  '/api/pedidos': {
    get: { tags: ['Pedidos'], summary: 'Listar pedidos', security: auth, responses: secured({ 200: { description: 'Lista de pedidos', content: json({ type: 'array', items: ref('Pedido') }) }, 500: error('Error interno') }) },
    post: { tags: ['Pedidos'], summary: 'Crear pedido', security: auth, requestBody: { required: true, content: json(ref('PedidoCreate')) }, responses: secured({ 201: { description: 'Pedido creado', content: json(ref('Pedido')) }, 400: error('Datos inválidos'), 404: { $ref: '#/components/responses/NotFound' }, 409: error('Mesa ocupada o producto no disponible'), 500: error('Error interno') }) }
  },
  '/api/pedidos/cocina': {
    get: {
      tags: ['Pedidos'],
      summary: 'Listar pedidos en cocina',
      security: auth,
      responses: secured({
        200: { description: 'Pedidos en cocina', content: json({ type: 'array', items: ref('Pedido') }) },
        403: { $ref: '#/components/responses/Forbidden' },
        500: error('Error interno')
      })
    }
  },
  '/api/pedidos/{id}/listo': {
    patch: {
      tags: ['Pedidos'],
      summary: 'Marcar pedido como listo desde cocina',
      security: auth,
      parameters: [id],
      responses: secured({
        200: { description: 'Pedido marcado como listo', content: json(ref('Pedido')) },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        409: error('Pedido no está en cocina')
      })
    }
  },
  '/api/pedidos/{id}': { get: { tags: ['Pedidos'], summary: 'Obtener pedido', security: auth, parameters: [id], responses: secured({ 200: { description: 'Pedido', content: json(ref('Pedido')) }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) }, delete: { tags: ['Pedidos'], summary: 'Eliminar pedido', security: auth, parameters: [id], responses: secured({ 200: { description: 'Pedido eliminado', content: json({ type: 'object', properties: { message: { type: 'string' } } }) }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) } },
  '/api/pedidos/{id}/estado': { patch: { tags: ['Pedidos'], summary: 'Actualizar estado de pedido', security: auth, parameters: [id], requestBody: { required: true, content: json(ref('EstadoPedido')) }, responses: secured({ 200: { description: 'Pedido actualizado', content: json(ref('Pedido')) }, 400: error('Estado inválido'), 404: { $ref: '#/components/responses/NotFound' }, 409: error('Transición de estado no permitida'), 500: error('Error interno') }) } },
  '/api/pedidos/{id}/descuento': { patch: { tags: ['Pedidos'], summary: 'Aplicar descuento porcentual', security: auth, parameters: [id], requestBody: { required: true, content: json({ type: 'object', required: ['porcentaje'], properties: { porcentaje: { type: 'number', minimum: 0, maximum: 100 } } }) }, responses: secured({ 200: { description: 'Descuento aplicado', content: json(ref('Pedido')) }, 400: error('Porcentaje inválido'), 409: error('Pedido no admite descuento') }) } },
  '/api/pedidos/{id}/cobrar': { post: { tags: ['Pedidos'], summary: 'Registrar cobro completo dividido por medios', security: auth, parameters: [id], requestBody: { required: true, content: json({ type: 'object', required: ['pagos'], properties: { pagos: { type: 'array', minItems: 1, items: ref('PagoPedido') } } }) }, responses: secured({ 200: { description: 'Cobro registrado', content: json(ref('Pedido')) }, 409: error('Caja cerrada o suma de pagos inválida') }) } },
  '/api/pedidos/{id}/anular-cobro': { post: { tags: ['Pedidos'], summary: 'Anular cobro completo conservando historial', security: auth, parameters: [id], responses: secured({ 200: { description: 'Cobro anulado', content: json(ref('Pedido')) }, 409: error('Cobro no anulable') }) } },
  '/api/pedidos/{id}/cerrar': { post: { tags: ['Pedidos'], summary: 'Cerrar pedido pagado y liberar mesa si corresponde', security: auth, parameters: [id], responses: secured({ 200: { description: 'Pedido cerrado', content: json(ref('Pedido')) }, 409: error('Pedido no está listo para cierre') }) } },
  '/api/caja/actual': { get: { tags: ['Caja'], summary: 'Obtener caja abierta', security: auth, responses: secured({ 200: { description: 'Caja abierta o null', content: json(ref('Caja')) }, 403: { $ref: '#/components/responses/Forbidden' } }) } },
  '/api/caja/abrir': { post: { tags: ['Caja'], summary: 'Abrir caja', security: auth, requestBody: { required: true, content: json({ type: 'object', required: ['montoInicial'], properties: { montoInicial: { type: 'number', minimum: 0 } } }) }, responses: secured({ 201: { description: 'Caja abierta', content: json(ref('Caja')) }, 409: error('Ya existe una caja abierta') }) } },
  '/api/caja/cerrar': { post: { tags: ['Caja'], summary: 'Cerrar caja y calcular arqueo', security: auth, requestBody: { required: true, content: json({ type: 'object', required: ['efectivoDeclarado'], properties: { efectivoDeclarado: { type: 'number', minimum: 0 } } }) }, responses: secured({ 200: { description: 'Caja cerrada', content: json(ref('Caja')) }, 409: error('No hay caja abierta') }) } },
  '/api/caja/{id}/movimientos': { get: { tags: ['Caja'], summary: 'Listar movimientos de caja', security: auth, parameters: [id], responses: secured({ 200: { description: 'Movimientos de caja', content: json({ type: 'array', items: { type: 'object' } }) }, 404: { $ref: '#/components/responses/NotFound' } }) } },
  '/api/mesas': { get: { tags: ['Mesas'], summary: 'Listar mesas', security: auth, responses: secured({ 200: { description: 'Lista de mesas', content: json({ type: 'array', items: ref('Mesa') }) }, 500: error('Error interno') }) }, post: { tags: ['Mesas'], summary: 'Crear mesa', security: auth, requestBody: { required: true, content: json(ref('Mesa')) }, responses: secured({ 201: { description: 'Mesa creada', content: json(ref('Mesa')) }, 400: error('Número de mesa duplicado'), 500: error('Error interno') }) } },
  '/api/mesas/{id}': { get: { tags: ['Mesas'], summary: 'Obtener mesa', security: auth, parameters: [id], responses: secured({ 200: { description: 'Mesa', content: json(ref('Mesa')) }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) }, put: { tags: ['Mesas'], summary: 'Actualizar mesa', security: auth, parameters: [id], requestBody: { required: true, content: json(ref('Mesa')) }, responses: secured({ 200: { description: 'Mesa actualizada', content: json(ref('Mesa')) }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) }, delete: { tags: ['Mesas'], summary: 'Eliminar mesa', security: auth, parameters: [id], responses: secured({ 200: { description: 'Mesa eliminada', content: json({ type: 'object', properties: { message: { type: 'string' } } }) }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) } },
  '/api/mesas/{id}/estado': { patch: { tags: ['Mesas'], summary: 'Actualizar estado de mesa', security: auth, parameters: [id], requestBody: { required: true, content: json(ref('EstadoMesa')) }, responses: secured({ 200: { description: 'Estado actualizado', content: json({ type: 'object', properties: { message: { type: 'string' }, mesa: ref('Mesa') } }) }, 404: { $ref: '#/components/responses/NotFound' }, 500: error('Error interno') }) } }
};
