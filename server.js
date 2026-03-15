const express = require('express');
const cors = require('cors');
const mysqlPromise = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión con Railway usando pool async/await
const pool = mysqlPromise.createPool({
  host: 'centerbeam.proxy.rlwy.net',
  user: 'root',
  password: 'fZBTGcwUuIMHEhqhENrUthOoKfegVorv',
  database: 'railway',
  port: 57928,
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
    const codigo = 'ART-' + Date.now(); // Generar código único
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

// ------------------- SERVIDOR -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});