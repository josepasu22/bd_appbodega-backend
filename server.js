const express = require('express');
const cors = require('cors');
const mysqlPromise = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión con async/await (pool)
const pool = mysqlPromise.createPool({
  host: 'centerbeam.proxy.rlwy.net',
  user: 'root',
  password: 'fZBTGcwUuIMHEhqhENrUthOoKfegVorv',
  database: 'railway',
  port: 57928,
  ssl: { rejectUnauthorized: false } // aceptar el certificado de Railway
});

// Ruta de prueba
app.get('/ping', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS fecha');
    res.json({ ok: true, fecha: rows[0].fecha });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ejemplo CRUD de artículos
app.get('/articulos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articulos');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/articulos', async (req, res) => {
  const { nombre, stock } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO articulos (nombre, stock) VALUES (?, ?)',
      [nombre, stock]
    );
    res.json({ id: result.insertId, nombre, stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/articulos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, stock } = req.body;
  try {
    await pool.query(
      'UPDATE articulos SET nombre = ?, stock = ? WHERE id = ?',
      [nombre, stock, id]
    );
    res.json({ id, nombre, stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/articulos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM articulos WHERE id = ?', [id]);
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// ------------------- ENDPOINTS -------------------

// Listar artículos
app.get('/articulos', (req, res) => {
  const sql = 'SELECT id, codigo, descripcion, cantidad, precio FROM articulos';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener artículos' });
    res.json(results);
  });
});

// Insertar artículo con código generado automáticamente
app.post('/articulos', (req, res) => {
  const { descripcion, cantidad, precio } = req.body;

  // Generar un código único (ejemplo: ART- seguido de timestamp)
  const codigo = 'ART-' + Date.now();

  db.query(
    'INSERT INTO articulos (codigo, descripcion, cantidad, precio) VALUES (?, ?, ?, ?)',
    [codigo, descripcion, cantidad, precio],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al insertar artículo' });
      }
      res.json({
        mensaje: 'Artículo agregado correctamente',
        id: result.insertId,
        codigo: codigo
      });
    }
  );
});

// Actualizar artículo por id
app.put('/articulos/:id', (req, res) => {
  const { id } = req.params;
  const { descripcion, cantidad, precio } = req.body;
  db.query(
    'UPDATE articulos SET descripcion = ?, cantidad = ?, precio = ? WHERE id = ?',
    [descripcion, cantidad, precio, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar artículo' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Artículo no encontrado' });
      res.json({ mensaje: 'Artículo actualizado correctamente' });
    }
  );
});

// Eliminar artículo por id
app.delete('/articulos/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM articulos WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar artículo' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }
    res.json({ mensaje: 'Artículo eliminado correctamente' });
  });
});

// Listar colaboradores
app.get('/colaboradores', (req, res) => {
  db.query('SELECT * FROM colaboradores', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener colaboradores' });
    res.json(results);
  });
});

// Listar despachos crudos
app.get('/despachos', (req, res) => {
  db.query('SELECT * FROM despachos', (err, results) => {
    if (err) {
      console.error("❌ Error SQL al listar despachos:", err.sqlMessage);
      return res.status(500).json({ error: err.sqlMessage });
    }
    res.json(results);
  });
});

// Listar despachos con detalle (usa pool con async/await)
app.get('/despachos/detalle', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.id AS despachoId,
        d.fecha,
        d.numeroDespacho,
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
    console.error(err);
    res.status(500).send("Error al obtener despachos con detalle");
  }
});

// Registrar despacho con validación de stock
app.post('/despachos', (req, res) => {
  const { fecha, colaboradorId, articuloId, cantidad } = req.body;

  if (!fecha || !colaboradorId || !articuloId || !cantidad) {
    return res.status(400).json({ mensaje: 'Faltan datos en la petición' });
  }

  // 1. Verificar stock disponible
  db.query('SELECT cantidad FROM articulos WHERE id = ?', [articuloId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al verificar stock' });
    if (results.length === 0) return res.status(404).json({ mensaje: 'Artículo no encontrado' });

    const stockActual = results[0].cantidad;
    if (stockActual < cantidad) {
      return res.status(400).json({ mensaje: 'Stock insuficiente para el despacho' });
    }

    // 2. Generar numeroDespacho automáticamente
    db.query('SELECT MAX(id) AS ultimoId FROM despachos', (errMax, resultsMax) => {
      if (errMax) return res.status(500).json({ error: 'Error al generar número de despacho' });

      const ultimoId = resultsMax[0].ultimoId || 0;
      const numeroDespacho = `D-${String(ultimoId + 1).padStart(3, '0')}`;

      // 3. Insertar cabecera en despachos
      db.query(
        'INSERT INTO despachos (numeroDespacho, fecha, colaboradorId) VALUES (?, ?, ?)',
        [numeroDespacho, fecha, colaboradorId],
        (err2, result2) => {
          if (err2) return res.status(500).json({ error: err2.sqlMessage });

          const despachoId = result2.insertId;

          // 4. Insertar detalle en detalle_despacho
          db.query(
            'INSERT INTO detalle_despacho (despachoId, articuloId, cantidad) VALUES (?, ?, ?)',
            [despachoId, articuloId, cantidad],
            (err4) => {
              if (err4) return res.status(500).json({ error: err4.sqlMessage });

              // 5. Reducir stock UNA sola vez
              db.query(
                'UPDATE articulos SET cantidad = cantidad - ? WHERE id = ?',
                [cantidad, articuloId],
                (err3) => {
                  if (err3) return res.status(500).json({ error: err3.sqlMessage });

                  res.status(201).json({
                    mensaje: 'Despacho registrado y stock actualizado',
                    despachoId,
                    numeroDespacho,
                    fecha,
                    colaboradorId,
                    articuloId,
                    cantidad
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

// ------------------- SERVIDOR -------------------
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});