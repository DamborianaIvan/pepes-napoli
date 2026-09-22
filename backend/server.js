import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { pathToFileURL } from 'node:url';
import { config, validateConfig } from './config.js';
import { openapiDefinition } from './docs/openapi.js';
import { paths } from './docs/paths.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import productosRoutes from './routes/productos.js';
import pedidosRoutes from './routes/pedidos.js';
import mesasRoutes from './routes/mesas.js';
import usuariosRoutes from './routes/usuarios.js';
import cajaRoutes from './routes/caja.js';
import stockRoutes from './routes/stock.js';

const swaggerDocs = { ...openapiDefinition, paths };
const app = express();

app.disable('x-powered-by');

app.use(cors({
  origin: config.corsOrigins
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/stock', stockRoutes);
app.use(notFound);
app.use(errorHandler);

export const startServer = async () => {
  validateConfig();
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB conectado');

  return app.listen(config.port, () => {
    console.log(`Servidor corriendo en puerto ${config.port}`);
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exitCode = 1;
  });
}

export default app;
