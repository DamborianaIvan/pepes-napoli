import 'dotenv/config'; 
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import mesasRoutes from './routes/mesas.js';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API Pepes Pizza',
      version: '1.0.0',
      description: 'Documentación de la API para pedidos y productos'
    },
    components: {
    securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    servers: [
      {
        url: process.env.BASE_URL,
        description: 'Servidor local'
      }
    ]
  },
  apis: ['./routes/*.js']
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs)
);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB conectado');
  })
  .catch((err) => {
    console.error('Error MongoDB:', err.message);
    console.log(err);
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
