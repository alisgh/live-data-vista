
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'plant.db');
const db = new sqlite3.Database(dbPath);

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS plant (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grow_days INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert default data if table is empty
  db.get("SELECT COUNT(*) as count FROM plant", (err, row) => {
    if (err) {
      console.error('Error checking plant table:', err);
      return;
    }
    
    if (row.count === 0) {
      const startDate = '2024-06-01';
      const currentDate = new Date();
      const start = new Date(startDate);
      const growDays = Math.floor((currentDate - start) / (1000 * 60 * 60 * 24));
      
      db.run(`INSERT INTO plant (name, grow_days, start_date) VALUES (?, ?, ?)`, 
        ['Green Dream', growDays, startDate], (err) => {
        if (err) {
          console.error('Error inserting default data:', err);
        } else {
          console.log('Default plant data inserted');
        }
      });
    }
  });
});

// API Routes

// GET /api/plant - Fetch current plant info
app.get('/api/plant', (req, res) => {
  db.get("SELECT * FROM plant ORDER BY id DESC LIMIT 1", (err, row) => {
    if (err) {
      console.error('Error fetching plant data:', err);
      res.status(500).json({ error: 'Failed to fetch plant data' });
      return;
    }
    
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
  });
});

// POST /api/plant/name - Update plant name
app.post('/api/plant/name', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Plant name is required' });
    return;
  }

  db.run(`UPDATE plant SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM plant ORDER BY id DESC LIMIT 1)`, 
    [name.trim()], function(err) {
    if (err) {
      console.error('Error updating plant name:', err);
      res.status(500).json({ error: 'Failed to update plant name' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'No plant data found to update' });
      return;
    }
    
    res.json({ success: true, message: 'Plant name updated successfully' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Plant backend server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
