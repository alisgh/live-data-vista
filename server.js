const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'plant.db');
const db = new Database(dbPath);

// Create table if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS plant (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  grow_days INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Insert default data if table is empty
const countRow = db.prepare("SELECT COUNT(*) as count FROM plant").get();

if (countRow.count === 0) {
  const startDate = '2024-06-01';
  const currentDate = new Date();
  const start = new Date(startDate);
  const growDays = Math.floor((currentDate - start) / (1000 * 60 * 60 * 24));
  
  const insertStmt = db.prepare(`INSERT INTO plant (name, grow_days, start_date) VALUES (?, ?, ?)`);
  insertStmt.run('Green Dream', growDays, startDate);
  console.log('Default plant data inserted');
}

// API Routes

// GET /api/plant - Fetch current plant info
app.get('/api/plant', (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM plant ORDER BY id DESC LIMIT 1");
    const row = stmt.get();
    
    if (!row) {
      res.status(404).json({ error: 'No plant data found' });
      return;
    }

    // Calculate current grow days based on start date
    const startDate = new Date(row.start_date);
    const currentDate = new Date();
    const currentGrowDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    
    res.json({
      id: row.id,
      name: row.name,
      growDays: currentGrowDays,
      startDate: row.start_date
    });
  } catch (err) {
    console.error('Error fetching plant data:', err);
    res.status(500).json({ error: 'Failed to fetch plant data' });
  }
});

// POST /api/plant/name - Update plant name
app.post('/api/plant/name', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Plant name is required' });
    return;
  }

  try {
    const stmt = db.prepare(`UPDATE plant SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM plant ORDER BY id DESC LIMIT 1)`);
    const result = stmt.run(name.trim());
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'No plant data found to update' });
      return;
    }
    
    res.json({ success: true, message: 'Plant name updated successfully' });
  } catch (err) {
    console.error('Error updating plant name:', err);
    res.status(500).json({ error: 'Failed to update plant name' });
  }
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Plant backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Also accessible at http://192.168.0.229:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close();
  console.log('Database connection closed.');
  process.exit(0);
});
