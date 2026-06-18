package com.qimlik.gateway

import android.app.Notification
import android.content.Context
import android.service.notification.StatusBarNotification
import android.service.notification.NotificationListenerService
import android.util.Log
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class NotificationReceiverService : NotificationListenerService() {

    private val client = OkHttpClient()

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val packageName = sbn.packageName
        
        // Intercept both WhatsApp and WhatsApp Business
        if (packageName == "com.whatsapp" || packageName == "com.whatsapp.w4b") {
            val extras = sbn.notification.extras
            val title = extras.getString(Notification.EXTRA_TITLE) ?: return // Contact name/number
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: return // Message text

            Log.d("QimlikGateway", "WhatsApp message from: $title, body: $text")

            // Simple pattern matching: Check if it looks like an OTP request (e.g. "AKTAS 123456")
            val cleanText = text.trim()
            val parts = cleanText.split("\\s+".toRegex())
            if (parts.size >= 2 && parts[0].length in 3..10 && cleanText.length < 40) {
                
                // Clean the sender name/number (remove spaces, parentheses, etc. to get digits)
                var cleanPhone = title.replace("\\s+".toRegex(), "")
                if (!cleanPhone.startsWith("+") && cleanPhone.matches(Regex("^[0-9]+$"))) {
                    cleanPhone = "+$cleanPhone" // Add leading plus if missing
                }

                // Read Settings
                val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
                val serverUrl = prefs.getString("server_url", null) ?: return
                val gatewayKey = prefs.getString("gateway_key", null) ?: return

                Log.d("QimlikGateway", "Forwarding WhatsApp OTP from: $cleanPhone, body: $cleanText")
                forwardWhatsAppToBackend(serverUrl, gatewayKey, cleanPhone, cleanText)
            }
        }
    }

    private fun forwardWhatsAppToBackend(serverUrl: String, gatewayKey: String, phone: String, message: String) {
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
                Log.e("QimlikGateway", "Failed to forward WhatsApp: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    Log.e("QimlikGateway", "Failed to forward WhatsApp. Server code: ${response.code}")
                } else {
                    Log.d("QimlikGateway", "WhatsApp forwarded successfully: ${response.code}")
                }
                response.close()
            }
        })
    }
}
