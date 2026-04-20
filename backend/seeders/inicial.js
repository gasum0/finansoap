// seeders/inicial.js
// Ejecutar con: node seeders/inicial.js
// Carga datos iniciales reales de Rosasenjabonarte

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Usuario, Cliente, Categoria, Insumo, Producto, Receta } = require('../src/models');

async function seed() {
  await sequelize.sync({ force: false });
  console.log('🌱 Iniciando seed...');

  // ─── USUARIOS ───
  const adminHash = await bcrypt.hash('finansoap2024', 10);
  const [admin] = await Usuario.findOrCreate({
    where: { email: 'carla@rosasenjabonarte.com' },
    defaults: { nombre: 'Carla Rosas', password_hash: adminHash, rol: 'admin' },
  });

  const opHash = await bcrypt.hash('operadora123', 10);
  await Usuario.findOrCreate({
    where: { email: 'elvia@rosasenjabonarte.com' },
    defaults: { nombre: 'Elvia Rengel', password_hash: opHash, rol: 'operadora' },
  });
  console.log('✅ Usuarios creados');

  // ─── CATEGORÍAS ───
  const [catJabones] = await Categoria.findOrCreate({ where: { nombre: 'Jabones de glicerina' } });
  const [catVelas] = await Categoria.findOrCreate({ where: { nombre: 'Velas decorativas' } });
  const [catBano] = await Categoria.findOrCreate({ where: { nombre: 'Productos de baño' } });
  const [catCursos] = await Categoria.findOrCreate({ where: { nombre: 'Cursos' } });
  console.log('✅ Categorías creadas');

  // ─── INSUMOS (materias primas reales de Rosasenjabonarte) ───
  const [glicerina] = await Insumo.findOrCreate({
    where: { nombre: 'Base de glicerina transparente' },
    defaults: { unidad: 'g', stock_actual: 5000, stock_minimo: 1000, costo_unitario: 12, proveedor: 'Proveedor local Bogotá' },
  });

  const [colorante] = await Insumo.findOrCreate({
    where: { nombre: 'Colorante cosmético' },
    defaults: { unidad: 'ml', stock_actual: 200, stock_minimo: 50, costo_unitario: 80, proveedor: 'Proveedor local Bogotá' },
  });

  const [fragancia] = await Insumo.findOrCreate({
    where: { nombre: 'Esencia / fragancia' },
    defaults: { unidad: 'ml', stock_actual: 300, stock_minimo: 60, costo_unitario: 120, proveedor: 'Proveedor local Bogotá' },
  });

  const [molde] = await Insumo.findOrCreate({
    where: { nombre: 'Molde silicona' },
    defaults: { unidad: 'unidad', stock_actual: 20, stock_minimo: 5, costo_unitario: 8000, proveedor: 'Proveedor manualidades' },
  });

  const [empaque] = await Insumo.findOrCreate({
    where: { nombre: 'Empaque individual (bolsa + sticker)' },
    defaults: { unidad: 'unidad', stock_actual: 500, stock_minimo: 100, costo_unitario: 800, proveedor: 'Imprenta local' },
  });

  const [tea] = await Insumo.findOrCreate({
    where: { nombre: 'Tea (mecha para velas)' },
    defaults: { unidad: 'cm', stock_actual: 2000, stock_minimo: 300, costo_unitario: 15, proveedor: 'Proveedor local Bogotá' },
  });

  const [parafina] = await Insumo.findOrCreate({
    where: { nombre: 'Parafina / cera de soya' },
    defaults: { unidad: 'g', stock_actual: 3000, stock_minimo: 500, costo_unitario: 8, proveedor: 'Proveedor local Bogotá' },
  });

  const [sal] = await Insumo.findOrCreate({
    where: { nombre: 'Sal de mar fina' },
    defaults: { unidad: 'g', stock_actual: 2000, stock_minimo: 400, costo_unitario: 4, proveedor: 'Proveedor local Bogotá' },
  });

  const [aceite] = await Insumo.findOrCreate({
    where: { nombre: 'Aceite portador (almendras / coco)' },
    defaults: { unidad: 'ml', stock_actual: 1000, stock_minimo: 200, costo_unitario: 35, proveedor: 'Proveedor local Bogotá' },
  });
  console.log('✅ Insumos creados');

  // ─── PRODUCTOS ───
  const [jabon100] = await Producto.findOrCreate({
    where: { sku: 'JAB-100G' },
    defaults: {
      nombre: 'Jabón de glicerina 100g',
      descripcion: 'Jabón artesanal de glicerina con fragancias y colorantes cosméticos. 100 gramos.',
      precio_venta: 15000,
      stock_actual: 30,
      stock_minimo: 10,
      unidad: 'unidad',
      categoria_id: catJabones.id,
    },
  });

  const [jabon200] = await Producto.findOrCreate({
    where: { sku: 'JAB-200G' },
    defaults: {
      nombre: 'Jabón de glicerina 200g',
      descripcion: 'Jabón artesanal de glicerina. Presentación 200 gramos.',
      precio_venta: 25000,
      stock_actual: 20,
      stock_minimo: 5,
      unidad: 'unidad',
      categoria_id: catJabones.id,
    },
  });

  const [velaAromatica] = await Producto.findOrCreate({
    where: { sku: 'VEL-ARO-150' },
    defaults: {
      nombre: 'Vela aromática 150g',
      descripcion: 'Vela decorativa y aromática en vaso de vidrio. 150 gramos.',
      precio_venta: 28000,
      stock_actual: 15,
      stock_minimo: 5,
      unidad: 'unidad',
      categoria_id: catVelas.id,
    },
  });

  const [salBano] = await Producto.findOrCreate({
    where: { sku: 'SAL-BANO-200' },
    defaults: {
      nombre: 'Sales de baño 200g',
      descripcion: 'Sales de baño con aceites esenciales y fragancias. 200 gramos.',
      precio_venta: 18000,
      stock_actual: 25,
      stock_minimo: 8,
      unidad: 'unidad',
      categoria_id: catBano.id,
    },
  });

  const [exfoliante] = await Producto.findOrCreate({
    where: { sku: 'EXF-150' },
    defaults: {
      nombre: 'Exfoliante corporal 150g',
      descripcion: 'Exfoliante corporal natural con sal de mar y aceites.',
      precio_venta: 22000,
      stock_actual: 20,
      stock_minimo: 5,
      unidad: 'unidad',
      categoria_id: catBano.id,
    },
  });

  const [curso] = await Producto.findOrCreate({
    where: { sku: 'CURSO-JAB-01' },
    defaults: {
      nombre: 'Curso: Fabricación de jabones artesanales',
      descripcion: 'Curso en línea de fabricación de jabones de glicerina. Acceso por 3 meses.',
      precio_venta: 120000,
      stock_actual: 30, // cupos disponibles
      stock_minimo: 0,
      unidad: 'cupo',
      categoria_id: catCursos.id,
    },
  });
  console.log('✅ Productos creados');

  // ─── RECETAS ───
  // Jabón 100g: 100g glicerina + 2ml colorante + 3ml fragancia + 1 empaque
  await Receta.findOrCreate({
    where: { producto_id: jabon100.id, insumo_id: glicerina.id },
    defaults: { cantidad_por_unidad: 100 },
  });
  await Receta.findOrCreate({
    where: { producto_id: jabon100.id, insumo_id: colorante.id },
    defaults: { cantidad_por_unidad: 2 },
  });
  await Receta.findOrCreate({
    where: { producto_id: jabon100.id, insumo_id: fragancia.id },
    defaults: { cantidad_por_unidad: 3 },
  });
  await Receta.findOrCreate({
    where: { producto_id: jabon100.id, insumo_id: empaque.id },
    defaults: { cantidad_por_unidad: 1 },
  });

  // Jabón 200g: 200g glicerina + 4ml colorante + 6ml fragancia + 1 empaque
  await Receta.findOrCreate({
    where: { producto_id: jabon200.id, insumo_id: glicerina.id },
    defaults: { cantidad_por_unidad: 200 },
  });
  await Receta.findOrCreate({
    where: { producto_id: jabon200.id, insumo_id: colorante.id },
    defaults: { cantidad_por_unidad: 4 },
  });
  await Receta.findOrCreate({
    where: { producto_id: jabon200.id, insumo_id: fragancia.id },
    defaults: { cantidad_por_unidad: 6 },
  });
  await Receta.findOrCreate({
    where: { producto_id: jabon200.id, insumo_id: empaque.id },
    defaults: { cantidad_por_unidad: 1 },
  });

  // Vela 150g: 150g parafina + 15cm tea + 5ml fragancia + 1 empaque
  await Receta.findOrCreate({
    where: { producto_id: velaAromatica.id, insumo_id: parafina.id },
    defaults: { cantidad_por_unidad: 150 },
  });
  await Receta.findOrCreate({
    where: { producto_id: velaAromatica.id, insumo_id: tea.id },
    defaults: { cantidad_por_unidad: 15 },
  });
  await Receta.findOrCreate({
    where: { producto_id: velaAromatica.id, insumo_id: fragancia.id },
    defaults: { cantidad_por_unidad: 5 },
  });
  await Receta.findOrCreate({
    where: { producto_id: velaAromatica.id, insumo_id: empaque.id },
    defaults: { cantidad_por_unidad: 1 },
  });

  // Sales de baño 200g: 180g sal + 20ml aceite + 2ml fragancia + 1 empaque
  await Receta.findOrCreate({
    where: { producto_id: salBano.id, insumo_id: sal.id },
    defaults: { cantidad_por_unidad: 180 },
  });
  await Receta.findOrCreate({
    where: { producto_id: salBano.id, insumo_id: aceite.id },
    defaults: { cantidad_por_unidad: 20 },
  });
  await Receta.findOrCreate({
    where: { producto_id: salBano.id, insumo_id: fragancia.id },
    defaults: { cantidad_por_unidad: 2 },
  });
  await Receta.findOrCreate({
    where: { producto_id: salBano.id, insumo_id: empaque.id },
    defaults: { cantidad_por_unidad: 1 },
  });

  // Exfoliante 150g: 120g sal + 30ml aceite + 2ml fragancia + 1 empaque
  await Receta.findOrCreate({
    where: { producto_id: exfoliante.id, insumo_id: sal.id },
    defaults: { cantidad_por_unidad: 120 },
  });
  await Receta.findOrCreate({
    where: { producto_id: exfoliante.id, insumo_id: aceite.id },
    defaults: { cantidad_por_unidad: 30 },
  });
  await Receta.findOrCreate({
    where: { producto_id: exfoliante.id, insumo_id: fragancia.id },
    defaults: { cantidad_por_unidad: 2 },
  });
  await Receta.findOrCreate({
    where: { producto_id: exfoliante.id, insumo_id: empaque.id },
    defaults: { cantidad_por_unidad: 1 },
  });
  console.log('✅ Recetas creadas');

  // ─── CLIENTES DE EJEMPLO ───
  await Cliente.findOrCreate({
    where: { telefono: '3001234567' },
    defaults: { nombre: 'María González', telefono: '3001234567', direccion: 'Calle 45 #12-30, Bogotá', email: 'maria@ejemplo.com' },
  });
  await Cliente.findOrCreate({
    where: { telefono: '3109876543' },
    defaults: { nombre: 'Distribuciones Artesanal', telefono: '3109876543', direccion: 'Carrera 7 #80-15, Bogotá', notas: 'Cliente mayorista, paga por transferencia' },
  });
  await Cliente.findOrCreate({
    where: { telefono: '3205551234' },
    defaults: { nombre: 'Laura Pérez', telefono: '3205551234', email: 'laura.p@gmail.com' },
  });
  console.log('✅ Clientes de ejemplo creados');

  console.log('\n🎉 Seed completado exitosamente');
  console.log('─────────────────────────────────');
  console.log('👤 Admin:    carla@rosasenjabonarte.com / finansoap2024');
  console.log('👤 Operadora: elvia@rosasenjabonarte.com / operadora123');
  console.log('─────────────────────────────────\n');

  await sequelize.close();
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
