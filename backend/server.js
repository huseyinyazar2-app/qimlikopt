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
const dijitalRoutes = require('./routes/dijital');
const mesaiRoutes = require('./routes/mesai');
const teslimatRoutes = require('./routes/teslimat');

app.use('/api/gateway', gatewayRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/dijital', dijitalRoutes);
app.use('/api/mesai', mesaiRoutes);
app.use('/api/teslimat', teslimatRoutes);

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
