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
            for (sms in messages) {
                val messageBody = sms.messageBody
                val senderPhone = sms.originatingAddress
                
                Log.d("QimlikGateway", "SMS received from: $senderPhone, body: $messageBody")
                
                // TODO: Send this to Backend API via Retrofit/OkHttp
                // ApiClient.sendSmsData(senderPhone, messageBody)
            }
        }
    }
}
