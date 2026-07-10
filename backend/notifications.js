const db = require('./db');
const { requireTier, TIER_RANK } = require('./auth');

// Faz 4: tarayici bazli bildirimler. Olay bazli (izin talebi, basarisiz teslim,
// ariza) + periyodik (SLA gecikmesi, yaklasan bakim). Dis servis YOK; panel ici
// bildirim merkezi + tarayici Notification API frontend tarafinda tuketir.

// Bir bildirim uretir. dedup_key ayni olayin tekrarini engeller (UNIQUE -> yok say).
async function notify({ module, company_id, target_role, type, title, body, link, entity_type, entity_id, dedup_key }) {
    if (!company_id || !dedup_key) return;
    const rank = target_role ? (TIER_RANK[target_role] ?? 0) : 0;
    try {
        await db.query(
            `INSERT INTO notifications (module, company_id, target_min_rank, type, title, body, link, entity_type, entity_id, dedup_key)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (module, company_id, dedup_key) DO NOTHING`,
            [module, company_id, rank, type, title, body || null, link || null, entity_type || null, entity_id || null, dedup_key]
        );
    } catch (err) {
        console.error('[notify] hata:', err.message);
    }
}

function readerKey(actor) {
    return actor && actor.user_id ? String(actor.user_id) : 'primary';
}

function actorRank(actor) {
    return TIER_RANK[actor?.tier || 'owner'] ?? 3;
}

/**
 * module bildirim uclarini router'a takar (panelUsers ile ayni desen).
 * companyGuard sonrasi req.company + req.actor gerektirir.
 */
function mountNotifications(router, { module, companyAuth }) {
    // Bildirim listesi + okunmamis sayisi
    router.get('/company/notifications', companyAuth, async (req, res) => {
        try {
            const reader = readerKey(req.actor);
            const rank = actorRank(req.actor);
            const { rows } = await db.query(
                `SELECT n.id, n.type, n.title, n.body, n.link, n.entity_type, n.entity_id, n.created_at,
                        CASE WHEN r.notification_id IS NULL THEN 0 ELSE 1 END as is_read
                 FROM notifications n
                 LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.reader = ?
                 WHERE n.module = ? AND n.company_id = ? AND n.target_min_rank <= ?
                 ORDER BY n.created_at DESC LIMIT 50`,
                [reader, module, req.company.id, rank]
            );
            const unread = rows.filter(r => !r.is_read).length;
            res.json({ notifications: rows, unread });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Tek bildirimi okundu isaretle
    router.put('/company/notifications/:id/read', companyAuth, async (req, res) => {
        try {
            await db.query(
                'INSERT OR IGNORE INTO notification_reads (notification_id, reader) VALUES (?, ?)',
                [req.params.id, readerKey(req.actor)]
            );
            res.json({ message: 'Okundu.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Gorunen tum bildirimleri okundu isaretle
    router.put('/company/notifications/read-all', companyAuth, async (req, res) => {
        try {
            await db.query(
                `INSERT OR IGNORE INTO notification_reads (notification_id, reader)
                 SELECT n.id, ? FROM notifications n
                 WHERE n.module = ? AND n.company_id = ? AND n.target_min_rank <= ?`,
                [readerKey(req.actor), module, req.company.id, actorRank(req.actor)]
            );
            res.json({ message: 'Tümü okundu.' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}

// --- PERIYODIK URETIM: SLA gecikmesi + yaklasan bakim (dijital) ---
async function runNotificationJobs() {
    try {
        // Geciken is emirleri -> bir kez bildir (dedup: sla_overdue:<woId>)
        const { rows: overdue } = await db.query(
            `SELECT wo.id, wo.company_id, wo.title, m.machine_name
             FROM dijital_work_orders wo
             LEFT JOIN dijital_machines m ON wo.machine_id = m.id
             WHERE wo.status NOT IN ('done','cancelled')
               AND wo.due_at IS NOT NULL AND wo.due_at < datetime('now')`
        );
        for (const wo of overdue) {
            await notify({
                module: 'dijital', company_id: wo.company_id, type: 'sla_overdue',
                title: 'İş emri SLA süresi aşıldı',
                body: `${wo.title}${wo.machine_name ? ' — ' + wo.machine_name : ''} için hedef çözüm süresi geçti.`,
                link: '/is-emirleri', entity_type: 'work_order', entity_id: wo.id,
                dedup_key: `sla_overdue:${wo.id}`,
            });
        }

        // Yaklasan/gecikmis onleyici bakim -> dedup: maintenance_due:<machineId>:<dueDate>
        const { rows: due } = await db.query(
            `SELECT id, company_id, machine_name,
                    date(last_maintenance_date, '+' || maintenance_interval_days || ' days') as due_date
             FROM dijital_machines
             WHERE maintenance_interval_days IS NOT NULL AND last_maintenance_date IS NOT NULL
               AND date(last_maintenance_date, '+' || maintenance_interval_days || ' days') <= date('now','+3 days')`
        );
        for (const m of due) {
            await notify({
                module: 'dijital', company_id: m.company_id, type: 'maintenance_due',
                title: 'Bakım zamanı yaklaştı',
                body: `${m.machine_name} için önleyici bakım tarihi: ${m.due_date}.`,
                link: '/is-emirleri', entity_type: 'machine', entity_id: m.id,
                dedup_key: `maintenance_due:${m.id}:${m.due_date}`,
            });
        }

        // Faz 6: dusuk/negatif stok -> gunde bir kez hatirlat (hareket olmasa da).
        const { rows: lowParts } = await db.query(
            `SELECT id, company_id, part_name, stock_quantity, min_stock
             FROM dijital_spare_parts
             WHERE stock_quantity < 0 OR (min_stock > 0 AND stock_quantity <= min_stock)`
        );
        const today = new Date().toISOString().slice(0, 10);
        for (const p of lowParts) {
            await notify({
                module: 'dijital', company_id: p.company_id, target_role: 'manager', type: 'low_stock',
                title: p.stock_quantity < 0 ? 'Stok negatife düştü' : 'Yedek parça stoğu azaldı',
                body: `${p.part_name}: kalan ${p.stock_quantity}${p.min_stock > 0 ? ` (uyarı eşiği ${p.min_stock})` : ''}.`,
                link: '/dashboard', entity_type: 'spare_part', entity_id: p.id,
                dedup_key: `low_stock:${p.id}:${today}`,
            });
        }

        // Faz 6: saklama suresi dolan giris selfie'lerini sil (firma ayarina gore).
        await db.query(
            `DELETE FROM mesai_log_photos
             WHERE id IN (
                 SELECT ph.id FROM mesai_log_photos ph
                 JOIN mesai_logs l ON ph.log_id = l.id
                 JOIN mesai_employees e ON l.employee_id = e.id
                 JOIN mesai_companies c ON e.company_id = c.id
                 WHERE julianday('now') - julianday(ph.created_at) > COALESCE(c.selfie_retention_days, 30)
             )`
        );
    } catch (err) {
        console.error('[notify-jobs] hata:', err.message);
    }
}

let jobTimer = null;
function startNotificationJobs(intervalMs = 300000) {
    if (jobTimer) return;
    // Baslangicta bir kez calis, sonra periyodik
    runNotificationJobs().catch(() => {});
    jobTimer = setInterval(() => { runNotificationJobs().catch(() => {}); }, intervalMs);
    if (jobTimer.unref) jobTimer.unref();
    console.log('[notify] Periyodik bildirim isleri baslatildi (' + Math.round(intervalMs / 1000) + 's).');
}

module.exports = { notify, mountNotifications, runNotificationJobs, startNotificationJobs };
