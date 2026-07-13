const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db');

// Entegrasyon (webhook imzasi + client API) icin guclu rastgele secret. 192-bit.
// Login sifresinden AYRIDIR; panelde gosterilir/kopyalanir, dondurulebilir.
function generateApiSecret() {
    return 'qsk_' + crypto.randomBytes(24).toString('hex');
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET tanımlı değil. Sunucu güvenli şekilde başlatılamaz.');
    process.exit(1);
}

const TOKEN_TTL = process.env.JWT_TTL || '30d';

async function hashPassword(plain) {
    return bcrypt.hash(String(plain), 10);
}

async function verifyPassword(plain, stored) {
    if (!stored) return false;
    // Düz metin eski kayıtları da kabul et (geçiş kolaylığı); yeni kayıtlar hep hash.
    if (stored.startsWith('$2')) {
        return bcrypt.compare(String(plain), stored);
    }
    return String(plain) === stored;
}

function isHashed(stored) {
    return typeof stored === 'string' && stored.startsWith('$2');
}

function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function readBearer(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
}

/**
 * Şirket paneli koruması. Modül adı ('mesai' | 'dijital' | 'teslimat' | 'client' | 'admin')
 * verilir; token bu modüle ve rol='company' (admin için 'admin') değerine ait olmalı.
 * Şirketi token'daki id'den okur, is_active doğrular ve req.company'ye koyar.
 */
function companyGuard(module, table) {
    return async (req, res, next) => {
        const token = readBearer(req);
        if (!token) {
            return res.status(401).json({ error: 'Yetkisiz erişim. Token bulunamadı.' });
        }
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Yetkisiz erişim. Geçersiz veya süresi dolmuş token.' });
        }
        if (payload.role !== 'company' || payload.module !== module) {
            return res.status(403).json({ error: 'Yetkisiz erişim. Bu işlem için yetkiniz yok.' });
        }
        try {
            const { rows } = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [payload.id]);
            const company = rows[0];
            if (!company) {
                return res.status(401).json({ error: 'Yetkisiz erişim. Hesap bulunamadı.' });
            }
            if (!company.is_active) {
                return res.status(403).json({ error: 'Hesap askıya alınmıştır.' });
            }
            req.company = company;
            // Faz 3: rol (tier) + alt kullanıcı bilgisi. Eski (tier'sız) token'lar owner sayılır.
            req.actor = {
                tier: payload.tier || 'owner',
                user_id: payload.user_id || null,
                name: payload.name || null,
            };
            next();
        } catch (err) {
            return res.status(500).json({ error: 'Sunucu hatası.' });
        }
    };
}

// Rol kademeleri (büyük = daha yetkili)
const TIER_RANK = { viewer: 0, operator: 1, manager: 2, owner: 3 };

/**
 * Minimum rol koruması. companyGuard'dan SONRA zincirlenir; req.actor.tier'a bakar.
 * Örn: requireTier('manager') -> viewer/operator reddedilir.
 */
function requireTier(minTier) {
    const min = TIER_RANK[minTier] ?? 0;
    return (req, res, next) => {
        const tier = req.actor?.tier || 'owner';
        if ((TIER_RANK[tier] ?? 0) < min) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
        }
        next();
    };
}

/**
 * Router seviyesinde salt-okunur koruması: 'viewer' rolündeki panel kullanıcısı
 * yazma (GET dışı) isteği yapamaz. Public/login rotaları (token yok) etkilenmez.
 * Router'ın en başına router.use(panelWriteGuard('mesai')) olarak takılır.
 */
function panelWriteGuard(module) {
    return (req, res, next) => {
        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
        const token = readBearer(req);
        if (!token) return next(); // public/login rotaları kendi doğrulamasını yapar
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return next(); // geçersiz token'ı ilgili guard reddeder
        }
        if (payload.role === 'company' && payload.module === module && payload.tier === 'viewer') {
            return res.status(403).json({ error: 'İzleyici rolü salt-okunurdur.' });
        }
        next();
    };
}

/**
 * Çalışan (personel/kurye/teknisyen) koruması. Token rol='worker', modül eşleşmeli.
 * req.worker = { id, company_id } koyar. İşlem gövdesindeki id'ye GÜVENMEZ.
 */
function workerGuard(module) {
    return (req, res, next) => {
        const token = readBearer(req);
        if (!token) {
            return res.status(401).json({ error: 'Yetkisiz erişim. Token bulunamadı.' });
        }
        let payload;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Yetkisiz erişim. Geçersiz veya süresi dolmuş token.' });
        }
        if (payload.role !== 'worker' || payload.module !== module) {
            return res.status(403).json({ error: 'Yetkisiz erişim. Bu işlem için yetkiniz yok.' });
        }
        req.worker = { id: payload.id, company_id: payload.company_id };
        next();
    };
}

module.exports = {
    hashPassword,
    verifyPassword,
    isHashed,
    generateApiSecret,
    signToken,
    companyGuard,
    workerGuard,
    requireTier,
    panelWriteGuard,
    TIER_RANK,
    readBearer,
    JWT_SECRET,
};
