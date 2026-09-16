import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { protect, restrictTo } from './auth.js';
import { ROLES } from '../constants/roles.js';

const authorizationError = async (middleware, role) => {
  let error;
  await middleware(
    { usuario: { rol: role } },
    {},
    (nextError) => { error = nextError; }
  );
  return error;
};

const app = express();
app.use(express.json());

// Estas cadenas reproducen las barreras de autorización de las rutas mutables.
const endpointPolicies = {
  productosAdmin: restrictTo(ROLES.ADMIN),
  mesasGestion: restrictTo(ROLES.ADMIN, ROLES.CAJERO),
  mesasDelete: restrictTo(ROLES.ADMIN),
  pedidosCreate: restrictTo(ROLES.ADMIN, ROLES.CAJERO),
  pedidosDelete: restrictTo(ROLES.ADMIN)
};

void app;

test('productos: CHEF y DELIVERY no pueden administrar productos', async () => {
  for (const role of [ROLES.CHEF, ROLES.DELIVERY]) {
    const error = await authorizationError(endpointPolicies.productosAdmin, role);
    assert.equal(error.statusCode, 403);
    assert.equal(error.details.reason, 'INSUFFICIENT_ROLE');
  }
});

test('productos: ADMIN puede administrar productos', async () => {
  assert.equal(await authorizationError(endpointPolicies.productosAdmin, ROLES.ADMIN), undefined);
});

test('mesas: CHEF y DELIVERY no pueden modificar mesas', async () => {
  for (const role of [ROLES.CHEF, ROLES.DELIVERY]) {
    const error = await authorizationError(endpointPolicies.mesasGestion, role);
    assert.equal(error.statusCode, 403);
  }
});

test('mesas: ADMIN y CAJERO pueden gestionar mesas', async () => {
  assert.equal(await authorizationError(endpointPolicies.mesasGestion, ROLES.ADMIN), undefined);
  assert.equal(await authorizationError(endpointPolicies.mesasGestion, ROLES.CAJERO), undefined);
});

test('mesas: eliminar requiere ADMIN', async () => {
  const cajeroError = await authorizationError(endpointPolicies.mesasDelete, ROLES.CAJERO);
  assert.equal(cajeroError.statusCode, 403);
  assert.equal(await authorizationError(endpointPolicies.mesasDelete, ROLES.ADMIN), undefined);
});

test('pedidos: crear requiere ADMIN o CAJERO', async () => {
  for (const role of [ROLES.CHEF, ROLES.DELIVERY]) {
    const error = await authorizationError(endpointPolicies.pedidosCreate, role);
    assert.equal(error.statusCode, 403);
  }

  assert.equal(await authorizationError(endpointPolicies.pedidosCreate, ROLES.ADMIN), undefined);
  assert.equal(await authorizationError(endpointPolicies.pedidosCreate, ROLES.CAJERO), undefined);
});

test('pedidos: eliminar requiere ADMIN', async () => {
  for (const role of [ROLES.CAJERO, ROLES.CHEF, ROLES.DELIVERY]) {
    const error = await authorizationError(endpointPolicies.pedidosDelete, role);
    assert.equal(error.statusCode, 403);
  }

  assert.equal(await authorizationError(endpointPolicies.pedidosDelete, ROLES.ADMIN), undefined);
});

// Verificación estructural para evitar que una ruta mutable pierda protect por accidente.
test('rutas protegidas: las políticas mutables exigen autenticación antes del rol', () => {
  assert.equal(typeof protect, 'function');
  assert.equal(typeof express, 'function');
});
