
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
  start_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Insert default data if table is empty
const countRow = db.prepare("SELECT COUNT(*) as count FROM plant").get();

if (countRow.count === 0) {
  const startDate = '2024-06-01';
  const insertStmt = db.prepare(`INSERT INTO plant (name, start_date) VALUES (?, ?)`);
  insertStmt.run('Green Dream', startDate);
  console.log('Default plant data inserted');
}

// Helper function to calculate grow days
const calculateGrowDays = (startDate) => {
  const start = new Date(startDate);
  const current = new Date();
  return Math.floor((current - start) / (1000 * 60 * 60 * 24));
};

// API Routes

// GET /api/plant - Fetch plant info (latest by default, or by id)
app.get('/api/plant', (req, res) => {
  try {
    const { id } = req.query;
    let stmt, row;
    
    if (id) {
      // Fetch specific plant by id
      stmt = db.prepare("SELECT * FROM plant WHERE id = ?");
      row = stmt.get(id);
      
      if (!row) {
        res.status(404).json({ error: `Plant with id ${id} not found` });
        return;
      }
    } else {
      // Fetch latest plant
      stmt = db.prepare("SELECT * FROM plant ORDER BY id DESC LIMIT 1");
      row = stmt.get();
      
      if (!row) {
        res.status(404).json({ error: 'No plant data found' });
        return;
      }
    }

    // Calculate current grow days based on start date
    const currentGrowDays = calculateGrowDays(row.start_date);
    
    res.json({
      id: row.id,
      name: row.name,
      growDays: currentGrowDays,
      startDate: row.start_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (err) {
    console.error('Error fetching plant data:', err);
    res.status(500).json({ error: 'Failed to fetch plant data' });
  }
});

// POST /api/plant - Create a new plant
app.post('/api/plant', (req, res) => {
  const { name, start_date } = req.body;
  
  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Plant name is required' });
    return;
  }
  
  if (!start_date) {
    res.status(400).json({ error: 'Start date is required' });
    return;
  }
  
  // Validate date format
  const startDate = new Date(start_date);
  if (isNaN(startDate.getTime())) {
    res.status(400).json({ error: 'Invalid start date format. Use ISO string format (e.g., "2024-06-01")' });
    return;
  }

  try {
    const stmt = db.prepare(`INSERT INTO plant (name, start_date) VALUES (?, ?)`);
    const result = stmt.run(name.trim(), start_date);
    
    const newPlantId = result.lastInsertRowid;
    const currentGrowDays = calculateGrowDays(start_date);
    
    res.status(201).json({
      success: true,
      message: 'Plant created successfully',
      plant: {
        id: newPlantId,
        name: name.trim(),
        growDays: currentGrowDays,
        startDate: start_date
      }
    });
  } catch (err) {
    console.error('Error creating plant:', err);
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

// POST /api/plant/name - Update plant name (legacy route for current plant)
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

// POST /api/plant/:id - Update plant by id (name and/or start_date)
app.post('/api/plant/:id', (req, res) => {
  const { id } = req.params;
  const { name, start_date } = req.body;
  
  if (!name && !start_date) {
    res.status(400).json({ error: 'Either name or start_date must be provided' });
    return;
  }
  
  // Validate plant exists
  const checkStmt = db.prepare("SELECT * FROM plant WHERE id = ?");
  const existingPlant = checkStmt.get(id);
  
  if (!existingPlant) {
    res.status(404).json({ error: `Plant with id ${id} not found` });
    return;
  }
  
  // Validate date if provided
  if (start_date) {
    const startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      res.status(400).json({ error: 'Invalid start date format. Use ISO string format (e.g., "2024-06-01")' });
      return;
    }
  }

  try {
    let updateQuery = 'UPDATE plant SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    
    if (name) {
      updateQuery += ', name = ?';
      params.push(name.trim());
    }
    
    if (start_date) {
      updateQuery += ', start_date = ?';
      params.push(start_date);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(id);
    
    const stmt = db.prepare(updateQuery);
    const result = stmt.run(...params);
    
    if (result.changes === 0) {
      res.status(404).json({ error: `Plant with id ${id} not found` });
      return;
    }
    
    // Fetch updated plant data
    const updatedPlant = checkStmt.get(id);
    const currentGrowDays = calculateGrowDays(updatedPlant.start_date);
    
    res.json({
      success: true,
      message: 'Plant updated successfully',
      plant: {
        id: updatedPlant.id,
        name: updatedPlant.name,
        growDays: currentGrowDays,
        startDate: updatedPlant.start_date,
        updatedAt: updatedPlant.updated_at
      }
    });
  } catch (err) {
    console.error('Error updating plant:', err);
    res.status(500).json({ error: 'Failed to update plant' });
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
