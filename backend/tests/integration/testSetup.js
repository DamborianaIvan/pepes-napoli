import { once } from 'node:events';
import mongoose from 'mongoose';
import app from '../../server.js';
import Usuario from '../../models/Usuario.js';

export const TEST_MONGODB_URI = process.env.MONGODB_TEST_URI;
export const INTEGRATION_ENABLED = Boolean(TEST_MONGODB_URI);

let server;
export let baseUrl;

export const limpiarUsuarios = async () => {
  await Usuario.deleteMany({});
};

export const crearUsuario = async (datos = {}) => {
  return Usuario.create({
    nombre: 'Administrador Test',
    nombreUsuario: 'admin-test',
    email: 'admin-test@example.com',
    password: 'password-admin-123',
    rol: 'ADMIN',
    ...datos
  });
};

export const iniciarServidorDePrueba = async () => {
  server = app.listen(0);
  await once(server, 'listening');
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
};

export const detenerServidorDePrueba = async () => {
  if (server) {
    server.close();
    await once(server, 'close');
    server = undefined;
  }
};

export const conectarBaseDePrueba = async () => {
  if (!TEST_MONGODB_URI) return;
  await mongoose.connect(TEST_MONGODB_URI);
};

export const desconectarBaseDePrueba = async () => {
  await mongoose.disconnect();
};

export const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });

  const body = await response.json();
  return { response, body };
};

export const loginComo = async (nombreUsuario, password) => {
  const { response, body } = await requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nombreUsuario, password })
  });

  if (!response.ok) {
    throw new Error(`No se pudo iniciar sesión: ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
};

export const authorization = (token) => ({
  authorization: `Bearer ${token}`
});
