const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => 
  res.json({ status: 'OK', message: 'Bantayan Ferry API is running' })
);

// Serve Cordova frontend
const frontendPath = path.join(__dirname, 'www'); // adjust if your folder name is different
app.use(express.static(frontendPath));

// Root route serves index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Optional: redirect all unknown routes to frontend (single-page app)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => 
  console.log(`🚢 Bantayan Ferry API running on port ${PORT}`)
);