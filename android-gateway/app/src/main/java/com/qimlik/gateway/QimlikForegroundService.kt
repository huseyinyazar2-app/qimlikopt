package com.qimlik.gateway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.ConnectivityManager
import android.net.Network
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
    private val WARNING_CHANNEL_ID = "QimlikWarningChannel"
    private var heartbeatTimer: Timer? = null
    private val client = OkHttpClient()

    private val LOW_BATTERY_NOTIF_ID = 101
    private val NO_INTERNET_NOTIF_ID = 102

    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var batteryReceiver: BroadcastReceiver? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        registerNetworkCallback()
        registerBatteryReceiver()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Qimlik Gateway Aktif")
            .setContentText("SMS doğrulama terminali arka planda çalışıyor.")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(1, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(1, notification)
        }

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
        }, 0, 120000) // Every 2 minutes (120,000 milliseconds)
    }

    private fun sendHeartbeat() {
        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", null) ?: return
        val gatewayKey = prefs.getString("gateway_key", null) ?: return
        val deviceName = prefs.getString("device_name", "Unknown Device")

        val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown_device_id"
        val battery = getBatteryLevel()
        val network = getNetworkType()

        // If offline, don't try to make HTTP post, just skip and rely on connection callback for warnings
        if (network == "OFFLINE") {
            Log.d("QimlikGateway", "Heartbeat skipped: Offline")
            return
        }

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

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                super.onAvailable(network)
                cancelNotification(NO_INTERNET_NOTIF_ID)
            }

            override fun onLost(network: Network) {
                super.onLost(network)
                showWarningNotification(
                    NO_INTERNET_NOTIF_ID,
                    "Qimlik: İnternet Bağlantısı Yok",
                    "Cihazın internet bağlantısı koptu! Lütfen bağlantıyı kontrol edin."
                )
            }
        }
        try {
            cm.registerDefaultNetworkCallback(networkCallback!!)
        } catch (e: Exception) {
            Log.e("QimlikGateway", "Failed to register network callback", e)
        }
    }

    private fun unregisterNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        networkCallback?.let {
            try {
                cm.unregisterNetworkCallback(it)
            } catch (e: Exception) {
                Log.e("QimlikGateway", "Failed to unregister network callback", e)
            }
        }
    }

    private fun registerBatteryReceiver() {
        batteryReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                intent?.let {
                    val level = it.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                    val scale = it.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                    if (level != -1 && scale != -1) {
                        val batteryPct = (level * 100 / scale.toFloat()).toInt()
                        if (batteryPct < 20) {
                            showWarningNotification(
                                LOW_BATTERY_NOTIF_ID,
                                "Qimlik: Düşük Pil Uyarısı",
                                "Cihaz pili %$batteryPct seviyesine düştü. Lütfen şarja takın!"
                            )
                        } else {
                            cancelNotification(LOW_BATTERY_NOTIF_ID)
                        }
                    }
                }
            }
        }
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        registerReceiver(batteryReceiver, filter)
    }

    private fun unregisterBatteryReceiver() {
        batteryReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (e: Exception) {
                Log.e("QimlikGateway", "Failed to unregister battery receiver", e)
            }
        }
    }

    private fun showWarningNotification(id: Int, title: String, message: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val builder = NotificationCompat.Builder(this, WARNING_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(Notification.DEFAULT_ALL)
            .setAutoCancel(true)
            
        notificationManager.notify(id, builder.build())
    }

    private fun cancelNotification(id: Int) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(id)
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterNetworkCallback()
        unregisterBatteryReceiver()
        heartbeatTimer?.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        val manager = getSystemService(NotificationManager::class.java) ?: return
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Qimlik Gateway Servis Kanalı",
                NotificationManager.IMPORTANCE_LOW
            )
            val warningChannel = NotificationChannel(
                WARNING_CHANNEL_ID,
                "Qimlik Gateway Uyarı Kanalı",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                enableVibration(true)
                enableLights(true)
            }
            manager.createNotificationChannel(serviceChannel)
            manager.createNotificationChannel(warningChannel)
        }
    }
}
