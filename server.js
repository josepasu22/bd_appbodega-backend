const express = require('express');
const cors = require('cors');
const mysqlPromise = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión con Railway usando variables de entorno
const pool = mysqlPromise.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

// ------------------- ENDPOINTS -------------------

// Ruta de prueba
app.get('/ping', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS fecha');
    res.json({ ok: true, fecha: rows[0].fecha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- ARTÍCULOS -------------------
app.get('/articulos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, codigo, descripcion, cantidad, precio FROM articulos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/articulos', async (req, res) => {
  const { descripcion, cantidad, precio } = req.body;
  try {
    const codigo = 'ART-' + Date.now();
    const [result] = await pool.query(
      'INSERT INTO articulos (codigo, descripcion, cantidad, precio) VALUES (?, ?, ?, ?)',
      [codigo, descripcion, cantidad, precio]
    );
    res.json({ id: result.insertId, codigo, descripcion, cantidad, precio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/articulos/:id', async (req, res) => {
  const { id } = req.params;
  const { descripcion, cantidad, precio } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE articulos SET descripcion = ?, cantidad = ?, precio = ? WHERE id = ?',
      [descripcion, cantidad, precio, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json({ mensaje: 'Artículo actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/articulos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM articulos WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Artículo no encontrado' });
    res.json({ mensaje: 'Artículo eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- COLABORADORES -------------------
app.get('/colaboradores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM colaboradores');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- DESPACHOS -------------------
app.get('/despachos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM despachos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/despachos/detalle', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.id AS despachoId,
        d.fecha,
        c.nombre AS colaborador,
        dep.nombre AS departamento,
        a.descripcion AS articulo,
        dd.cantidad,
        a.precio AS precioUnitario,
        (dd.cantidad * a.precio) AS total
      FROM despachos d
      JOIN colaboradores c ON d.colaboradorId = c.id
      JOIN departamentos dep ON c.departamentoId = dep.id
      JOIN detalle_despacho dd ON d.id = dd.despachoId
      JOIN articulos a ON dd.articuloId = a.id
      ORDER BY d.fecha DESC, d.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/despachos', async (req, res) => {
  const { fecha, colaboradorId, articuloId, cantidad } = req.body;

  if (!fecha || !colaboradorId || !articuloId || !cantidad) {
    return res.status(400).json({ mensaje: 'Faltan datos en la petición' });
  }

  try {
    const [articulo] = await pool.query('SELECT cantidad FROM articulos WHERE id = ?', [articuloId]);
    if (articulo.length === 0) return res.status(404).json({ mensaje: 'Artículo no encontrado' });

    const stockActual = articulo[0].cantidad;
    if (stockActual < cantidad) {
      return res.status(400).json({ mensaje: 'Stock insuficiente para el despacho' });
    }

    const [resultDespacho] = await pool.query(
      'INSERT INTO despachos (fecha, colaboradorId) VALUES (?, ?)',
      [fecha, colaboradorId]
    );
    const despachoId = resultDespacho.insertId;

    await pool.query(
      'INSERT INTO detalle_despacho (despachoId, articuloId, cantidad) VALUES (?, ?, ?)',
      [despachoId, articuloId, cantidad]
    );

    await pool.query('UPDATE articulos SET cantidad = cantidad - ? WHERE id = ?', [cantidad, articuloId]);

    res.status(201).json({
      mensaje: 'Despacho registrado y stock actualizado',
      despachoId,
      fecha,
      colaboradorId,
      articuloId,
      cantidad
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- SERVIDOR -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});