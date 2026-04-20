// tests/pedidos.test.js
const request = require('supertest');
const { app } = require('../../server');
const { sequelize, Usuario, Cliente, Producto, Categoria } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let token;
let clienteId;
let productoId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_secret_finansoap';
  await sequelize.sync({ force: true });

  const hash = await bcrypt.hash('test1234', 10);
  const usuario = await Usuario.create({ nombre: 'Test Admin', email: 'test@test.com', password_hash: hash, rol: 'admin' });
  token = jwt.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre }, process.env.JWT_SECRET);

  const cliente = await Cliente.create({ nombre: 'Cliente Test', telefono: '3000000001' });
  clienteId = cliente.id;

  const cat = await Categoria.create({ nombre: 'Test Cat' });
  const prod = await Producto.create({ nombre: 'Jabón Test', sku: 'JAB-TEST', precio_venta: 15000, stock_actual: 50, stock_minimo: 5, categoria_id: cat.id });
  productoId = prod.id;
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/pedidos', () => {
  it('crea un pedido correctamente', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cliente_id: clienteId,
        metodo_pago: 'nequi',
        items: [{ producto_id: productoId, cantidad: 2 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.pedido).toBeDefined();
    expect(res.body.pedido.estado).toBe('pendiente');
    expect(res.body.pedido.total).toBe('30000.00');
    expect(res.body.pedido.codigo).toMatch(/^PED-/);
  });

  it('rechaza pedido sin items', async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({ cliente_id: clienteId, items: [] });

    expect(res.status).toBe(400);
  });

  it('rechaza pedido sin token', async () => {
    const res = await request(app).post('/api/pedidos').send({ cliente_id: clienteId });
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/pedidos/:id/estado', () => {
  let pedidoId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`)
      .send({ cliente_id: clienteId, items: [{ producto_id: productoId, cantidad: 1 }] });
    pedidoId = res.body.pedido.id;
  });

  it('permite transición válida pendiente → en_preparacion', async () => {
    const res = await request(app)
      .patch(`/api/pedidos/${pedidoId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'en_preparacion' });

    expect(res.status).toBe(200);
    expect(res.body.estadoNuevo).toBe('en_preparacion');
  });

  it('rechaza transición inválida pendiente → entregado', async () => {
    const res = await request(app)
      .patch(`/api/pedidos/${pedidoId}/estado`)
      .set('Authorization', `Bearer ${token}`)
      .send({ estado: 'entregado' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Transición inválida/);
  });
});

describe('GET /api/pedidos', () => {
  it('lista pedidos con autenticación', async () => {
    const res = await request(app)
      .get('/api/pedidos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.pedidos)).toBe(true);
  });
});
