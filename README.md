# Pepe's Napoletana

Backoffice operativo para gestión de restaurante, desarrollado con **React + TypeScript + Vite + MUI** en el panel y **Node.js + Express + MongoDB + Mongoose** en el backend.

La versión v1 cubre el circuito completo de operación interna: pedidos, salón, cocina, caja, pagos, tickets, stock, recetas, reportes y auditoría.

## Alcance

Incluido en v1:

- usuarios, roles y permisos
- pedidos de Salón, Takeaway y Delivery
- cocina / KDS
- caja, pagos múltiples, descuentos y arqueo
- tickets de venta
- ingredientes, recetas y movimientos de stock
- plano visual de mesas
- reportes de ventas, caja y stock
- auditoría y trazabilidad

Fuera de alcance actual:

- frontend público para clientes
- pedidos web
- reservas
- integraciones externas de delivery
- WebSockets como requisito
- microservicios

El directorio `frontend/` queda reservado para una evolución futura y no forma parte del release operativo actual.

## Estructura

```text
backend/   API REST y lógica de negocio
panel/     Backoffice administrativo
frontend/  Futuro frontend público, fuera de alcance v1
```

## Stack

### Backend

- Node.js
- Express 5
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS
- Swagger
- Node ESM

### Panel

- React 19
- TypeScript
- Vite
- Material UI
- Recharts
- Day.js

## Configuración local

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Variables principales:

```env
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
MONGODB_URI=mongodb://localhost:27017/pepes-napoli
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
JWT_EXPIRES_IN=1d
CORS_ORIGINS=http://localhost:5173
```

### Panel

```bash
cd panel
npm install
cp .env.example .env
npm run dev
```

```env
VITE_API_URL=http://localhost:5000
```

## Primera instalación

El endpoint público de registro se utiliza **solo para crear el primer ADMIN**.

1. iniciar backend y panel;
2. abrir `/register`;
3. crear el administrador inicial;
4. a partir de ese momento el registro público queda cerrado;
5. los usuarios posteriores se crean desde **USUARIOS** por un ADMIN.

## Roles

- `ADMIN`
- `CAJERO`
- `CHEF`
- `DELIVERY`

La autorización real se valida en backend mediante roles y permisos. El panel solo adapta navegación y acciones visibles.

## Pedidos

Estados operativos:

```text
ABIERTO
CONFIRMADO
EN_COCINA
LISTO
SERVIDO
EN_CAMINO
ENTREGADO
CANCELADO
```

Estados de pago:

```text
PENDIENTE
PAGADO
ANULADO
```

Tipos:

```text
SALON
DELIVERY
TAKEAWAY
```

Para pedidos de salón, `SERVIDO` es el último estado operativo. El cierre comercial se representa por separado mediante `cierre.cerrado = true`.

## Flujos principales

### Salón

```text
Mesa libre
→ pedido
→ EN_COCINA
→ LISTO
→ SERVIDO
→ cobro
→ PAGADO
→ cierre
→ mesa libre
```

### Takeaway

```text
Pedido
→ EN_COCINA
→ LISTO
→ ENTREGADO
→ cobro/cierre
```

### Delivery

```text
Pedido
→ EN_COCINA
→ LISTO
→ DELIVERY marca ENTREGADO
→ cobro/cierre
```

El rol `DELIVERY` utiliza una vista operativa exclusiva. Solo recibe pedidos de delivery disponibles para reparto y su única acción de dominio es marcarlos como entregados. No accede al Dashboard, Mesas ni al historial general de pedidos.

## API y monitoreo

Swagger:

```text
GET /api-docs
```

Healthcheck:

```text
GET /api/health
```

El healthcheck devuelve estado del servicio, conexión MongoDB, uptime y timestamp.

## Testing

Backend:

```bash
cd backend
npm test
```

Los tests de integración que requieren MongoDB se habilitan con:

```env
MONGODB_TEST_URI=mongodb://localhost:27017/pepes-napoli-test
```

Panel:

```bash
cd panel
npm run build
npm run lint
```

## Seguridad

- JWT con secreto obligatorio de al menos 32 caracteres
- CORS configurable por entorno
- usuario recargado desde DB en cada request autenticado
- registro público limitado al bootstrap inicial
- contraseñas hasheadas con bcrypt
- password excluido por defecto en consultas de usuario
- respuestas de error 5xx sin detalles internos
- headers básicos de seguridad
- límites de JSON request
- auditoría de operaciones sensibles
- archivos `.env` excluidos del repositorio

## Release v1

La checklist de validación y despliegue se encuentra en:

`RELEASE_V1.md`

## Autores

Agustina Di Natale e Ivan Damboriana
