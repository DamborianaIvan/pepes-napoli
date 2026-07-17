import 'dotenv/config';

const port = Number.parseInt(process.env.PORT, 10);

export const config = Object.freeze({
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
  port: Number.isInteger(port) && port > 0 ? port : 5000
});

export const validateConfig = () => {
  const missing = [
    ['MONGODB_URI (o MONGO_URI)', config.mongoUri],
    ['JWT_SECRET', config.jwtSecret]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(', ')}`);
  }
};
