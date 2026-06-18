package com.qimlik.gateway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class SmsReceiver : BroadcastReceiver() {
    
    private val client = OkHttpClient()

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            
            // Read settings
            val prefs = context.getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
            val serverUrl = prefs.getString("server_url", null) ?: return
            val gatewayKey = prefs.getString("gateway_key", null) ?: return

            for (sms in messages) {
                val messageBody = sms.messageBody
                val senderPhone = sms.originatingAddress ?: "Unknown"
                
                Log.d("QimlikGateway", "SMS received from: $senderPhone, body: $messageBody")
                
                sendSmsToBackend(serverUrl, gatewayKey, senderPhone, messageBody)
            }
        }
    }

    private fun sendSmsToBackend(serverUrl: String, gatewayKey: String, phone: String, message: String) {
        val json = JSONObject().apply {
            put("phone", phone)
            put("message", message)
        }

        val mediaType = "application/json; charset=utf-8".toMediaType()
        val requestBody = json.toString().toRequestBody(mediaType)

        val request = Request.Builder()
            .url("$serverUrl/api/gateway/receive")
            .header("x-gateway-key", gatewayKey)
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("QimlikGateway", "Failed to forward SMS: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    Log.e("QimlikGateway", "Failed to forward SMS. Server returned: ${response.code}")
                } else {
                    Log.d("QimlikGateway", "SMS forwarded successfully: ${response.code}")
                }
                response.close()
            }
        })
    }
}
