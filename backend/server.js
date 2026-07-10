require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3303;

// Proxy (nginx/traefik) arkasında doğru istemci IP'si için
app.set('trust proxy', 1);

// CORS
const cors = require('cors');
app.use(cors());

// Body limitleri: base64 foto/imza için makul üst sınır
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Genel hız sınırı (IP başına): gateway ve polling trafiğine yetecek kadar
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' },
});
app.use('/api', globalLimiter);

// Kimlik doğrulama / kod deneme uçlarına sıkı sınır (brute-force koruması)
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Çok fazla deneme. Lütfen bir dakika sonra tekrar deneyin.' },
});
app.use((req, res, next) => {
    if (/(\/login|\/register|\/login\/request|verify-status)$/.test(req.path)) {
        return authLimiter(req, res, next);
    }
    next();
});

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
const { startWebhookProcessor } = require('./webhook');
const { startNotificationJobs } = require('./notifications');

// Start Server
app.listen(PORT, async () => {
    console.log(`Qimlik Core Server is running on port ${PORT}`);
    await initDb();
    // Dis webhook teslim kuyrugu yeniden deneme islemcisi
    startWebhookProcessor(30000);
    // Periyodik bildirim uretimi (SLA gecikmesi, yaklasan bakim)
    startNotificationJobs(300000);
});
