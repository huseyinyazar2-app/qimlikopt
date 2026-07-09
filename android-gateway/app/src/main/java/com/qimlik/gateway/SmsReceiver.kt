package com.qimlik.gateway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log

class SmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)

            // Ayarlar yapılmadıysa iletme
            val prefs = context.getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
            if (prefs.getString("server_url", null) == null || prefs.getString("gateway_key", null) == null) {
                return
            }

            for (sms in messages) {
                val messageBody = sms.messageBody ?: continue
                val senderPhone = sms.originatingAddress ?: "Unknown"

                Log.d("QimlikGateway", "SMS alındı: $senderPhone -> $messageBody")

                // Güvenilir kuyruğa ekle (ağ yoksa bile kaybolmaz)
                ForwardMessageWorker.enqueue(context, senderPhone, messageBody)
            }
        }
    }
}
