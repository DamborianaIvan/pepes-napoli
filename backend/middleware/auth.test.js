import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { protect, restrictTo } from './auth.js';

const executeMiddleware = async (middleware, req) => {
  let nextError;
  let nextCalled = false;

  await middleware(req, {}, (error) => {
    nextCalled = true;
    nextError = error;
  });

  return { nextCalled, nextError };
};

test('protect rechaza requests sin token', async () => {
  const result = await executeMiddleware(protect, { headers: {} });

  assert.equal(result.nextCalled, true);
  assert.equal(result.nextError.statusCode, 401);
  assert.equal(result.nextError.details.reason, 'MISSING_TOKEN');
});

test('protect rechaza tokens inválidos', async () => {
  const result = await executeMiddleware(protect, {
    headers: { authorization: 'Bearer token-invalido' }
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.nextError.statusCode, 401);
  assert.equal(result.nextError.details.reason, 'INVALID_TOKEN');
});

test('protect acepta un JWT válido y carga el usuario en la request', async () => {
  const token = jwt.sign({ id: 'usuario-1', rol: 'ADMIN' }, config.jwtSecret, {
    expiresIn: '1h'
  });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const result = await executeMiddleware(protect, req);

  assert.equal(result.nextCalled, true);
  assert.equal(result.nextError, undefined);
  assert.equal(req.usuario.id, 'usuario-1');
  assert.equal(req.usuario.rol, 'ADMIN');
});

test('restrictTo rechaza un rol no autorizado', async () => {
  const result = await executeMiddleware(restrictTo('ADMIN'), {
    usuario: { rol: 'CHEF' }
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.nextError.statusCode, 403);
  assert.equal(result.nextError.details.reason, 'INSUFFICIENT_ROLE');
});

test('restrictTo permite un rol autorizado', async () => {
  const result = await executeMiddleware(restrictTo('ADMIN', 'CAJERO'), {
    usuario: { rol: 'CAJERO' }
  });

  assert.equal(result.nextCalled, true);
  assert.equal(result.nextError, undefined);
});
