import test, { after, before, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import Mesa from '../../models/Mesa.js';
import {
  INTEGRATION_ENABLED,
  authorization,
  conectarBaseDePrueba,
  crearMesa,
  crearUsuario,
  desconectarBaseDePrueba,
  detenerServidorDePrueba,
  iniciarServidorDePrueba,
  limpiarPedidos,
  limpiarUsuarios,
  loginComo,
  requestJson
} from './testSetup.js';

describe('integración: plano visual de mesas', { skip: !INTEGRATION_ENABLED }, () => {
  before(async () => {
    await conectarBaseDePrueba();
    await iniciarServidorDePrueba();
  });

  beforeEach(async () => {
    await limpiarPedidos();
    await limpiarUsuarios();
  });

  after(async () => {
    await detenerServidorDePrueba();
    await desconectarBaseDePrueba();
  });

  const prepararUsuarios = async () => {
    await crearUsuario();
    await crearUsuario({
      nombre: 'Cajero Plano',
      nombreUsuario: 'cajero-plano',
      email: 'cajero-plano@example.com',
      rol: 'CAJERO'
    });

    const [admin, cajero] = await Promise.all([
      loginComo('admin-test', 'password-admin-123'),
      loginComo('cajero-plano', 'password-admin-123')
    ]);

    return { admin, cajero };
  };

  test('ADMIN puede crear una nueva mesa y evita números duplicados', async () => {
    const { admin } = await prepararUsuarios();

    const primera = await requestJson('/api/mesas', {
      method: 'POST',
      headers: authorization(admin.token),
      body: JSON.stringify({
        numero: 10,
        nombre: 'Patio',
        capacidad: 6,
        observaciones: 'Mesa agregada desde el editor'
      })
    });

    assert.equal(primera.response.status, 201);
    assert.equal(primera.body.numero, 10);
    assert.equal(primera.body.nombre, 'Patio');
    assert.equal(primera.body.capacidad, 6);
    assert.equal(primera.body.estado, 'LIBRE');

    const duplicada = await requestJson('/api/mesas', {
      method: 'POST',
      headers: authorization(admin.token),
      body: JSON.stringify({
        numero: 10,
        capacidad: 4
      })
    });

    assert.equal(duplicada.response.status, 409);
    assert.equal(await Mesa.countDocuments({ numero: 10 }), 1);
  });

  test('ADMIN persiste posición, tamaño, rotación y forma del plano', async () => {
    const { admin } = await prepararUsuarios();
    const mesa1 = await crearMesa({ numero: 1 });
    const mesa2 = await crearMesa({ numero: 2 });

    const { response, body } = await requestJson('/api/mesas/layout', {
      method: 'PATCH',
      headers: authorization(admin.token),
      body: JSON.stringify({
        mesas: [
          {
            id: mesa1._id.toString(),
            layout: {
              x: 100,
              y: 120,
              ancho: 160,
              alto: 100,
              rotacion: 45,
              forma: 'RECTANGULAR'
            }
          },
          {
            id: mesa2._id.toString(),
            layout: {
              x: 500,
              y: 250,
              ancho: 120,
              alto: 120,
              rotacion: 0,
              forma: 'REDONDA'
            }
          }
        ]
      })
    });

    assert.equal(response.status, 200);
    assert.equal(body.mesas.length, 2);

    const [guardada1, guardada2] = await Promise.all([
      Mesa.findById(mesa1._id).lean(),
      Mesa.findById(mesa2._id).lean()
    ]);

    assert.deepEqual(guardada1.layout, {
      x: 100,
      y: 120,
      ancho: 160,
      alto: 100,
      rotacion: 45,
      forma: 'RECTANGULAR'
    });
    assert.deepEqual(guardada2.layout, {
      x: 500,
      y: 250,
      ancho: 120,
      alto: 120,
      rotacion: 0,
      forma: 'REDONDA'
    });
  });

  test('CAJERO puede ver mesas pero no modificar el layout', async () => {
    const { cajero } = await prepararUsuarios();
    const mesa = await crearMesa({ numero: 3 });

    const lectura = await requestJson('/api/mesas', {
      headers: authorization(cajero.token)
    });
    assert.equal(lectura.response.status, 200);

    const cambio = await requestJson('/api/mesas/layout', {
      method: 'PATCH',
      headers: authorization(cajero.token),
      body: JSON.stringify({
        mesas: [{
          id: mesa._id.toString(),
          layout: {
            x: 10,
            y: 10,
            ancho: 120,
            alto: 100,
            rotacion: 0,
            forma: 'RECTANGULAR'
          }
        }]
      })
    });

    assert.equal(cambio.response.status, 403);
  });

  test('rechaza mesas fuera del plano y no aplica cambios parciales', async () => {
    const { admin } = await prepararUsuarios();
    const mesa1 = await crearMesa({ numero: 4 });
    const mesa2 = await crearMesa({ numero: 5 });

    const { response } = await requestJson('/api/mesas/layout', {
      method: 'PATCH',
      headers: authorization(admin.token),
      body: JSON.stringify({
        mesas: [
          {
            id: mesa1._id.toString(),
            layout: {
              x: 50,
              y: 50,
              ancho: 120,
              alto: 100,
              rotacion: 0,
              forma: 'RECTANGULAR'
            }
          },
          {
            id: mesa2._id.toString(),
            layout: {
              x: 1150,
              y: 650,
              ancho: 120,
              alto: 100,
              rotacion: 0,
              forma: 'RECTANGULAR'
            }
          }
        ]
      })
    });

    assert.equal(response.status, 400);

    const guardada1 = await Mesa.findById(mesa1._id).lean();
    assert.equal(guardada1.layout.x, 0);
    assert.equal(guardada1.layout.y, 0);
  });
});
