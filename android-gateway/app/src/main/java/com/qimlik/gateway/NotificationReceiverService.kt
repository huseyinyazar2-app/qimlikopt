package com.qimlik.gateway

import android.app.Notification
import android.content.Context
import android.service.notification.StatusBarNotification
import android.service.notification.NotificationListenerService
import android.util.Log
import java.util.LinkedHashMap

class NotificationReceiverService : NotificationListenerService() {

    companion object {
        // Son işlenen mesajların cache'i (kısa sürede tekrarları engellemek için)
        private val processedMessagesCache = LinkedHashMap<String, Long>(10, 0.75f, true)
        private const val DUP_TIMEOUT_MS = 5000 // 5 saniye
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName

        // Hem WhatsApp hem WhatsApp Business
        if (packageName == "com.whatsapp" || packageName == "com.whatsapp.w4b") {

            // Grup özeti bildirimlerini yok say
            val isSummary = (sbn.notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0
            if (isSummary) {
                return
            }

            val extras = sbn.notification.extras
            val title = extras.getString(Notification.EXTRA_TITLE) ?: return // Kişi adı/numarası
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: return // Mesaj metni

            Log.d("QimlikGateway", "WhatsApp mesajı: $title -> $text")

            // Basit OTP kalıbı: "PREFIX 123456" gibi (ilk kelime 3-10 karakter, en az 2 kelime, kısa)
            val cleanText = text.trim()
            val parts = cleanText.split("\\s+".toRegex())
            if (parts.size >= 2 && parts[0].length in 3..10 && cleanText.length < 40) {

                // Gönderen adı/numarasını temizle: boşluk, parantez, tire vb.
                var cleanPhone = title.replace("[\\s()\\-]".toRegex(), "")
                // Sadece rakam kaldıysa (numara) ve + yoksa başına + ekle
                if (!cleanPhone.startsWith("+") && cleanPhone.matches(Regex("^[0-9]+$"))) {
                    cleanPhone = "+$cleanPhone"
                }

                // Tekrar kontrolü
                val signature = "$cleanPhone:$cleanText".uppercase()
                val now = System.currentTimeMillis()
                synchronized(processedMessagesCache) {
                    val lastSeen = processedMessagesCache[signature]
                    if (lastSeen != null && (now - lastSeen) < DUP_TIMEOUT_MS) {
                        return
                    }
                    processedMessagesCache[signature] = now
                    if (processedMessagesCache.size > 50) {
                        val iterator = processedMessagesCache.keys.iterator()
                        if (iterator.hasNext()) {
                            iterator.next()
                            iterator.remove()
                        }
                    }
                }

                // Ayarlar yapılmadıysa iletme
                val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
                if (prefs.getString("server_url", null) == null || prefs.getString("gateway_key", null) == null) {
                    return
                }

                Log.d("QimlikGateway", "WhatsApp OTP kuyruğa alınıyor: $cleanPhone -> $cleanText")
                // Güvenilir kuyruğa ekle (ağ yoksa bile kaybolmaz)
                ForwardMessageWorker.enqueue(applicationContext, cleanPhone, cleanText)
            }
        }
    }
}
