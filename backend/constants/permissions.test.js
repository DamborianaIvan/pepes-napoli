import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSIONS, PERMISSIONS_BY_ROLE, hasPermission, isValidPermission } from './permissions.js';
import { ROLES } from './roles.js';

test('todos los roles tienen una matriz de permisos definida', () => {
  for (const role of Object.values(ROLES)) {
    assert.ok(Array.isArray(PERMISSIONS_BY_ROLE[role]));
  }
});

test('ADMIN tiene todos los permisos definidos', () => {
  assert.deepEqual(
    PERMISSIONS_BY_ROLE[ROLES.ADMIN],
    Object.values(PERMISSIONS)
  );
});

test('CAJERO tiene permisos operativos de pedidos, caja y reportes', () => {
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.ORDERS_CREATE), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.ORDERS_EDIT), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.ORDERS_CANCEL), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.ORDERS_CHANGE_STATUS), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.CASH_OPEN), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.CASH_CLOSE), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.REPORTS_VIEW), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.PRODUCTS_MANAGE), false);
});

test('CHEF y DELIVERY solo tienen cambio de estado de pedidos', () => {
  for (const role of [ROLES.CHEF, ROLES.DELIVERY]) {
    assert.equal(hasPermission(role, PERMISSIONS.ORDERS_CHANGE_STATUS), true);
    assert.equal(hasPermission(role, PERMISSIONS.ORDERS_CREATE), false);
    assert.equal(hasPermission(role, PERMISSIONS.CASH_OPEN), false);
    assert.equal(hasPermission(role, PERMISSIONS.REPORTS_VIEW), false);
  }
});

test('isValidPermission distingue permisos configurados de valores desconocidos', () => {
  assert.equal(isValidPermission(PERMISSIONS.ORDERS_CREATE), true);
  assert.equal(isValidPermission('orders:unknown'), false);
});
