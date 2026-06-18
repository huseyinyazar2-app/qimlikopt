package com.qimlik.gateway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.Timer
import java.util.TimerTask

class QimlikForegroundService : Service() {

    private val CHANNEL_ID = "QimlikGatewayChannel"
    private var heartbeatTimer: Timer? = null
    private val client = OkHttpClient()

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Qimlik Gateway Aktif")
            .setContentText("SMS doğrulama terminali arka planda çalışıyor.")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        startForeground(1, notification)
        
        startHeartbeatLoop()
        
        return START_STICKY
    }

    private fun startHeartbeatLoop() {
        heartbeatTimer?.cancel()
        heartbeatTimer = Timer()
        heartbeatTimer?.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                sendHeartbeat()
            }
        }, 0, 30000) // Every 30 seconds
    }

    private fun sendHeartbeat() {
        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", null) ?: return
        val gatewayKey = prefs.getString("gateway_key", null) ?: return
        val deviceName = prefs.getString("device_name", "Unknown Device")

        val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown_device_id"
        val battery = getBatteryLevel()
        val network = getNetworkType()

        val json = JSONObject().apply {
            put("device_id", deviceId)
            put("device_name", deviceName)
            put("battery", battery)
            put("network", network)
        }

        val mediaType = "application/json; charset=utf-8".toMediaType()
        val requestBody = json.toString().toRequestBody(mediaType)

        val request = Request.Builder()
            .url("$serverUrl/api/gateway/heartbeat")
            .header("x-gateway-key", gatewayKey)
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("QimlikGateway", "Heartbeat failed: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                if (!response.isSuccessful) {
                    Log.e("QimlikGateway", "Heartbeat server error: ${response.code}")
                } else {
                    Log.d("QimlikGateway", "Heartbeat sent successfully")
                }
                response.close()
            }
        })
    }

    private fun getBatteryLevel(): Int {
        val bm = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun getNetworkType(): String {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = cm.activeNetwork ?: return "OFFLINE"
        val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return "OFFLINE"
        
        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WIFI"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "MOBILE"
            else -> "CONNECTED"
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        heartbeatTimer?.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        val serviceChannel = NotificationChannel(
            CHANNEL_ID,
            "Qimlik Gateway Service Channel",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(serviceChannel)
    }
}
