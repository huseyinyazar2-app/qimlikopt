package com.qimlik.gateway

import android.app.Notification
import android.service.notification.StatusBarNotification
import android.service.notification.NotificationListenerService
import android.util.Log

/**
 * Bildirimlerden OTP mesajı yakalar. WhatsApp'ın yanı sıra SMS uygulamalarını da
 * dinler — böylece SMS, ayrı RECEIVE_SMS izni / autostart / pil ayarı gerektiren
 * BroadcastReceiver'a bağlı kalmadan, zaten verilen "bildirim erişimi" üzerinden
 * de yakalanır (özellikle ColorOS/MIUI gibi arka planı kısıtlayan ROM'larda güvenilir).
 */
class NotificationReceiverService : NotificationListenerService() {

    companion object {
        // WhatsApp + yaygın SMS uygulamalarının paket adları
        private val ALLOWED_PACKAGES = setOf(
            "com.whatsapp",                        // WhatsApp
            "com.whatsapp.w4b",                    // WhatsApp Business
            "com.google.android.apps.messaging",   // Google Mesajlar
            "com.samsung.android.messaging",       // Samsung Mesajlar
            "com.android.messaging",               // AOSP Mesajlar
            "com.oppo.mms", "com.coloros.mms",     // Oppo/ColorOS
            "com.miui.smsextra", "com.android.mms" // Xiaomi / eski AOSP
        )
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName !in ALLOWED_PACKAGES) return

        val n = sbn.notification
        // Grup özeti veya kalıcı/sürüyor bildirimlerini yok say (gerçek mesaj değil)
        if ((n.flags and Notification.FLAG_GROUP_SUMMARY) != 0) return
        if ((n.flags and Notification.FLAG_ONGOING_EVENT) != 0) return

        val extras = n.extras
        val title = extras.getString(Notification.EXTRA_TITLE) // gönderen adı/numarası

        // Mesaj metnini sağlam biçimde çıkar (SMS uygulamaları farklı alanlar kullanabilir)
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()
            ?: extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
            ?: extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.lastOrNull()?.toString()
            ?: return

        Log.d("QimlikGateway", "Bildirim (${sbn.packageName}): $title -> $text")
        MessageForwarder.handle(applicationContext, title, text)
    }
}
