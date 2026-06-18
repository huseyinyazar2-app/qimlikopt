require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3303;

// Enable CORS
const cors = require('cors');
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const gatewayRoutes = require('./routes/gateway');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');

app.use('/api/gateway', gatewayRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

const initDb = require('./db/init');

// Start Server
app.listen(PORT, async () => {
    console.log(`Qimlik Core Server is running on port ${PORT}`);
    await initDb();
});
