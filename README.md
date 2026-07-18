# Pepes Napoletana- Sistema Fullstack de Gestión y Pedidos

Proyecto desarrollado con **React + Vite + MUI** en el frontend, y **Express.js + MongoDB** en el backend. Cuenta con dos interfaces principales:

- `frontend/`: Menú web para clientes (visualización y pedidos)
- `panel/`: Panel administrativo para gestionar productos, pedidos, métricas y ajustes
- `backend/`: API REST para manejo de datos y lógica del sistema

---

## 🧱 Tech Stack

| Parte      | Tecnologías                             |
|------------|------------------------------------------|
| Frontend   | React, Vite, TypeScript, MUI             |
| Panel      | React, Vite, MUI, Context API            |
| Backend    | Node.js, Express.js, MongoDB, Mongoose   |
| API Docs   | Swagger (`/api-docs`)                    |

---

## 🚀 Instalación local

1. Clonar el repositorio:

```bash
git clone https://github.com/tuusuario/fresco-sushi.git
cd fresco-sushi
````

2. Instalar y correr cada parte:

### ➤ Frontend (menú cliente)

```bash
cd frontend
npm install
npm run dev
```

### ➤ Panel (admin)

```bash
cd panel
npm install
npm run dev
```

### ➤ Backend

```bash
cd backend
npm install
npm run dev
```

> Asegurate de tener tu archivo `.env` con la conexión a MongoDB.

---

## 📂 Estructura del proyecto

```
fresco-sushi/
│
├── frontend/           # Sitio de pedidos online
│   └── components/     # Componentes reutilizables (ProductCard, MenuSection, etc.)
│
├── panel/              # Panel administrativo
│   ├── components/     # Reutilizables (Modal, Table, Button, Snackbar, etc.)
│   ├── modules/        # Vistas: Productos, Pedidos, Reportes, Ajustes
│   └── context/        # Contextos (auth, notificaciones, productos, etc.)
│
├── backend/
│   ├── routes/         # Endpoints de API (productos, pedidos, ajustes, etc.)
│   ├── models/         # Esquemas de Mongoose
│   ├── controllers/    # Lógica de cada recurso
│   ├── middleware/     # Validaciones y control de errores
│   └── swagger/        # Documentación Swagger
```

---

## 📚 Documentación de la API

Disponible en:

```
http://localhost:5000/api-docs
```

> La documentación incluye: autenticación, pedidos, productos, reportes y estados.

---

## 🧾 Objetos del sistema (resumen JSON)

### `Producto`

```ts
{
  _id: string,
  nombre: string,
  descripcion: string,
  precio: number,
  categoria: string,
  disponible: boolean,
  imagen: string,
  stockGeneral: boolean
}
```

### `Pedido`

```ts
{
  _id: string,
  productos: [ { productId, cantidad } ],
  total: number,
  metodoPago: 'efectivo' | 'transferencia',
  tipoEntrega: 'delivery' | 'takeaway',
  estado: 'pending' | 'en_preparación' | 'en_reparto' | 'entregado' | 'cancelado',
  comentario: string,
  fecha: Date
}
```

---

## 🎨 Componentes reutilizables (panel)

* `ReusableModal`: Para crear/editar productos.
* `ConfirmDeleteDialog`: Confirmación antes de eliminar.
* `SnackbarAlert`: Muestra confirmaciones según acción.
* `StatusBadge`: Colores según estado del pedido.
* `ProductCard`: Muestra producto con disponibilidad.
* `CustomTable`: Tablas reutilizables con headers dinámicos.

---

## 🧪 Testing

### Manual

* Flujo completo: agregar productos, hacer pedido, cambio de estado.

### Automatizado

* Planificado con:

  * `React Testing Library` para frontend/panel.
  * `Jest + Supertest` para endpoints backend.

---

## 🚦 Nomenclatura de estados de pedido

| Estado           | Descripción                             | Color UI |
| ---------------- | --------------------------------------- | -------- |
| `pending`      | Pedido recibido, esperando confirmación | Amarillo |
| `en_preparación` | En cocina / preparando                  | Azul     |
| `en_reparto`     | En camino (solo delivery)               | Celeste  |
| `entregado`      | Completado y entregado                  | Verde    |
| `cancelado`      | Cancelado por cliente o admin           | Rojo     |

---

## 🧩 Nomenclatura para tareas (Jira, ClickUp, etc.)

Usamos **prefijos** y convención `[TIPO]-[MÓDULO]-[DESCRIPCIÓN]`:

| Prefijo | Uso                           | Ejemplo                                      |
| ------- | ----------------------------- | -------------------------------------------- |
| `FE`    | Tarea del frontend cliente    | `FE-MENU-Agregar sección de promos`          |
| `PA`    | Tarea del panel admin         | `PA-REPORTES-Filtrar métricas por mes`       |
| `BE`    | Backend (API, DB, lógica)     | `BE-PEDIDOS-Agregar endpoint de cancelar`    |
| `BUG`   | Corrección de error           | `BUG-PANEL-Snackbar no muestra confirmación` |
| `TEST`  | Testing manual o automatizado | `TEST-FE-Checkout con método de pago`        |
| `DOC`   | Documentación o diagramas     | `DOC-BE-Actualizar Swagger de pedidos`       |

---

## 🧠 Ajustes y configuración (desde el panel)

* Cambiar stock general (`true/false`)
* Activar o desactivar producto individual
* Editar precios, categorías o nombres
* Agregar productos con imagen (base64 o file)

---

## 📦 Funcionalidades destacadas

* 🛒 Pedido online desde el menú (cliente)
* 📈 Métricas por mes, tipo de pedido y método de pago
* 🧾 Historial de pedidos agrupados por fecha
* 🔄 Estados de pedido actualizables en tiempo real
* 📷 Gestión de productos con imágenes y disponibilidad

---

## 🧑‍💻 Desarrollado por

* Agustina Di Natale e Ivan Damboriana 

---

## 📬 Contacto y soporte

* WhatsApp: \[tu número]
* Email: \[tu email]
* IG: @frescosushi

---
