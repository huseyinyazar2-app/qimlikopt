package com.qimlik.gateway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat

class QimlikForegroundService : Service() {

    private val CHANNEL_ID = "QimlikGatewayChannel"

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
        
        // Return START_STICKY to ensure service is restarted if killed by OS
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null // Not binding to anything
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
