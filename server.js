const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// PostgreSQL Pool Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon Postgres connection in development
  }
});

// Database Initialization
async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Iniciando base de datos en Neon Postgres...');
    
    // Create thoughts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS thoughts (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create outings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS outings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Tablas inicializadas correctamente (thoughts, outings).');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  } finally {
    client.release();
  }
}

// Routes

// 1. Pensamientos (Thoughts)
app.get('/api/thoughts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM thoughts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pensamientos:', err);
    res.status(500).json({ error: 'Error del servidor al obtener pensamientos' });
  }
});

app.post('/api/thoughts', async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'El contenido del pensamiento es obligatorio' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO thoughts (content) VALUES ($1) RETURNING *',
      [content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al guardar pensamiento:', err);
    res.status(500).json({ error: 'Error del servidor al guardar pensamiento' });
  }
});

// 2. Salidas/Calendario (Outings)
app.get('/api/outings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outings ORDER BY date ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener salidas:', err);
    res.status(500).json({ error: 'Error del servidor al obtener salidas del calendario' });
  }
});

app.post('/api/outings', async (req, res) => {
  const { title, description, date, time } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'El título y la fecha son obligatorios' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO outings (title, description, date, time) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, date, time]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al agendar salida:', err);
    res.status(500).json({ error: 'Error del servidor al agendar la salida' });
  }
});

// For any other routes, serve frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  console.log(`Visita: http://localhost:${PORT}`);
  await initDatabase();
});
