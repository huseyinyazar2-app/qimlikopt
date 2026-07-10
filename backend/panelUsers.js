const db = require('./db');
const { signToken, hashPassword, verifyPassword, requireTier } = require('./auth');

// Panel alt kullanicilari (Faz 3). Sahip (owner) mevcut sirket hesabidir; buradaki
// kayitlar ek personeldir. Owner API ile OLUSTURULAMAZ (yalnizca birincil hesap owner).
const ASSIGNABLE_ROLES = ['manager', 'operator', 'viewer'];

function sanitizeCompany(company) {
    if (!company) return company;
    const { password, ...safe } = company;
    return safe;
}

/**
 * module'e ait alt kullanici login + yonetim rotalarini router'a takar.
 * @param router Express router (ilgili modulun router'i)
 * @param opts { module, companyTable, companyAuth }
 */
function mountPanelUsers(router, { module, companyTable, companyAuth }) {
    const ownerOnly = [companyAuth, requireTier('owner')];

    // --- ALT KULLANICI GIRISI (e-posta + sifre) ---
    router.post('/company/users/login', async (req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
        }
        try {
            const { rows } = await db.query(
                'SELECT * FROM panel_users WHERE module = ? AND email = ?',
                [module, String(email).trim().toLowerCase()]
            );
            const user = rows[0];
            if (!user || !(await verifyPassword(password, user.password))) {
                return res.status(401).json({ error: 'Hatalı e-posta veya şifre.' });
            }
            if (!user.is_active) {
                return res.status(403).json({ error: 'Kullanıcı hesabı pasif.' });
            }
            const { rows: cRows } = await db.query(`SELECT * FROM ${companyTable} WHERE id = ?`, [user.company_id]);
            const company = cRows[0];
            if (!company || !company.is_active) {
                return res.status(403).json({ error: 'Şirket hesabı aktif değil.' });
            }
            const token = signToken({
                role: 'company', module, id: company.id,
                tier: user.role, user_id: user.id, name: user.name,
            });
            res.json({
                message: 'Giriş başarılı.',
                token,
                company: sanitizeCompany(company),
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- KULLANICI LISTESI (sahip) ---
    router.get('/company/users', ...ownerOnly, async (req, res) => {
        try {
            const { rows } = await db.query(
                'SELECT id, name, email, role, is_active, created_at FROM panel_users WHERE module = ? AND company_id = ? ORDER BY created_at ASC',
                [module, req.company.id]
            );
            // Birincil (owner) hesabi da listede goster — duzenlenemez/silinemez
            const owner = {
                id: 'primary',
                name: [req.company.contact_name, req.company.contact_surname].filter(Boolean).join(' ') || 'Sahip',
                email: req.company.phone_number || '',
                role: 'owner',
                is_active: 1,
                is_primary: true,
                login_hint: 'Telefon ile giriş',
            };
            res.json({ owner, users: rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- KULLANICI OLUSTUR (sahip) ---
    router.post('/company/users', ...ownerOnly, async (req, res) => {
        let { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Ad, e-posta ve şifre zorunludur.' });
        }
        role = ASSIGNABLE_ROLES.includes(role) ? role : 'operator';
        email = String(email).trim().toLowerCase();
        if (String(password).length < 6) {
            return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
        }
        try {
            const { rows: dup } = await db.query('SELECT id FROM panel_users WHERE module = ? AND email = ?', [module, email]);
            if (dup.length > 0) {
                return res.status(400).json({ error: 'Bu e-posta zaten kullanılıyor.' });
            }
            const hashed = await hashPassword(password);
            await db.query(
                'INSERT INTO panel_users (module, company_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
                [module, req.company.id, name, email, hashed, role]
            );
            res.status(201).json({ message: 'Kullanıcı oluşturuldu.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- KULLANICI GUNCELLE (sahip): ad/rol/sifre/aktiflik ---
    router.put('/company/users/:id', ...ownerOnly, async (req, res) => {
        const { name, role, password, is_active } = req.body;
        try {
            const { rows } = await db.query('SELECT * FROM panel_users WHERE id = ? AND module = ? AND company_id = ?', [req.params.id, module, req.company.id]);
            const user = rows[0];
            if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

            const newName = name != null ? name : user.name;
            const newRole = ASSIGNABLE_ROLES.includes(role) ? role : user.role;
            const newActive = is_active === undefined ? user.is_active : (is_active ? 1 : 0);
            let newPass = user.password;
            if (password) {
                if (String(password).length < 6) {
                    return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
                }
                newPass = await hashPassword(password);
            }
            await db.query(
                'UPDATE panel_users SET name = ?, role = ?, password = ?, is_active = ? WHERE id = ? AND module = ? AND company_id = ?',
                [newName, newRole, newPass, newActive, req.params.id, module, req.company.id]
            );
            res.json({ message: 'Kullanıcı güncellendi.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // --- KULLANICI SIL (sahip) ---
    router.delete('/company/users/:id', ...ownerOnly, async (req, res) => {
        try {
            await db.query('DELETE FROM panel_users WHERE id = ? AND module = ? AND company_id = ?', [req.params.id, module, req.company.id]);
            res.json({ message: 'Kullanıcı silindi.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}

module.exports = { mountPanelUsers };
