import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSIONS, hasPermission } from '../constants/permissions.js';
import { ROLES } from '../constants/roles.js';

test('users:manage is restricted to ADMIN', () => {
  assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.USERS_MANAGE), true);
  assert.equal(hasPermission(ROLES.CAJERO, PERMISSIONS.USERS_MANAGE), false);
  assert.equal(hasPermission(ROLES.CHEF, PERMISSIONS.USERS_MANAGE), false);
  assert.equal(hasPermission(ROLES.DELIVERY, PERMISSIONS.USERS_MANAGE), false);
});
