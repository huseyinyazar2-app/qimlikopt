package com.qimlik.gateway

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var statusText: TextView
    private lateinit var statusSubText: TextView
    private lateinit var btnEditSettings: Button
    
    private lateinit var cardNotificationWarning: CardView
    private lateinit var btnGrantNotification: Button

    private val PERMISSION_REQUEST_CODE = 100
    private var hasRequestedPermissions = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Status View Elements
        statusText = findViewById(R.id.statusText)
        statusSubText = findViewById(R.id.statusSubText)
        btnEditSettings = findViewById(R.id.btnEditSettings)

        // Notification Warning Elements
        cardNotificationWarning = findViewById(R.id.cardNotificationWarning)
        btnGrantNotification = findViewById(R.id.btnGrantNotification)

        // Bind button actions
        btnEditSettings.setOnClickListener { openSettingsPage() }
        btnGrantNotification.setOnClickListener { openNotificationAccessSettings() }

        // Initial setup check
        checkFirstRun()
    }

    override fun onResume() {
        super.onResume()
        checkNotificationListenerPermission()
        updateStatus()

        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", null)
        if (serverUrl != null) {
            if (!hasRequestedPermissions && !hasAllPermissions()) {
                hasRequestedPermissions = true
                requestPermissions()
            } else if (hasAllPermissions()) {
                startGatewayService()
            }
        }
    }

    private fun checkFirstRun() {
        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", null)

        if (serverUrl == null) {
            // First time - direct to settings activity
            openSettingsPage()
        }
    }

    private fun openSettingsPage() {
        val intent = Intent(this, SettingsActivity::class.java)
        startActivity(intent)
    }

    private fun hasAllPermissions(): Boolean {
        val permissions = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        return permissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val listPermissionsNeeded = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (listPermissionsNeeded.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                listPermissionsNeeded.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                startGatewayService()
            } else {
                Toast.makeText(this, "Gerekli izinler reddedildi! SMS'ler yakalanamaz.", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun checkNotificationListenerPermission() {
        val cn = ComponentName(this, NotificationReceiverService::class.java)
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        val isEnabled = flat != null && flat.contains(cn.flattenToString())
        
        if (isEnabled) {
            cardNotificationWarning.visibility = View.GONE
        } else {
            cardNotificationWarning.visibility = View.VISIBLE
        }
    }

    private fun openNotificationAccessSettings() {
        try {
            val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Ayarlar sayfası açılamadı. Lütfen manuel olarak cihaz bildirim erişimini verin.", Toast.LENGTH_LONG).show()
        }
    }

    private fun startGatewayService() {
        val serviceIntent = Intent(this, QimlikForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        updateStatus()
    }

    private fun updateStatus() {
        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", null)
        
        if (serverUrl != null) {
            statusText.text = "Aktif (Çalışıyor)"
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_green_dark))
            statusSubText.text = "Bağlanılan Sunucu: $serverUrl"
        } else {
            statusText.text = "Beklemede"
            statusText.setTextColor(ContextCompat.getColor(this, android.R.color.holo_orange_dark))
            statusSubText.text = "Lütfen kurulum yapın."
        }
    }
}
