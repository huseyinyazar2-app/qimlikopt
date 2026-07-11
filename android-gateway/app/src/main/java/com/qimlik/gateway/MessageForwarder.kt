package com.qimlik.gateway

import android.content.Context
import android.util.Log
import java.util.LinkedHashMap

/**
 * Gelen mesajları (WhatsApp bildirimi VEYA SMS) tek noktadan işler:
 *  - OTP kalıbı süzgeci ("PREFIX 123456": ilk kelime 3-10 karakter, >=2 kelime, kısa)
 *  - gönderen numarasını temizler
 *  - kısa süreli tekrar önleme (aynı mesaj iki kanaldan gelirse tek kez gönderilir)
 *  - ayar (sunucu + anahtar) yoksa iletmez
 *  - güvenilir kuyruğa (WorkManager) ekler
 *
 * Tekrar imzası yalnızca MESAJ GÖVDESİNE dayanır; çünkü SMS gerçek numarayı,
 * bildirim ise rehberdeki adı verebilir — gövde iki kanalda da aynıdır.
 */
object MessageForwarder {

    private val processedCache = LinkedHashMap<String, Long>(10, 0.75f, true)
    private const val DUP_TIMEOUT_MS = 15000L // 15 sn

    fun handle(context: Context, rawSender: String?, rawBody: String?) {
        val body = rawBody?.trim() ?: return
        val parts = body.split("\\s+".toRegex())
        if (parts.size < 2 || parts[0].length !in 3..10 || body.length >= 40) return

        // Gönderen: boşluk/parantez/tire temizle; sadece rakamsa başına +
        var phone = (rawSender ?: "").replace("[\\s()\\-]".toRegex(), "")
        if (!phone.startsWith("+") && phone.matches(Regex("^[0-9]+$"))) {
            phone = "+$phone"
        }

        // Tekrar önleme — gövde bazlı (iki kanaldan gelirse tek gönderim)
        val signature = body.uppercase()
        val now = System.currentTimeMillis()
        synchronized(processedCache) {
            val lastSeen = processedCache[signature]
            if (lastSeen != null && (now - lastSeen) < DUP_TIMEOUT_MS) return
            processedCache[signature] = now
            if (processedCache.size > 50) {
                val it = processedCache.keys.iterator()
                if (it.hasNext()) { it.next(); it.remove() }
            }
        }

        val prefs = context.getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        if (prefs.getString("server_url", null) == null || prefs.getString("gateway_key", null) == null) {
            return
        }

        Log.d("QimlikGateway", "OTP kuyruğa alınıyor: $phone -> $body")
        ForwardMessageWorker.enqueue(context.applicationContext, phone, body)
    }
}
