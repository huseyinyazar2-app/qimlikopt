package com.qimlik.gateway

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var editServerUrl: EditText
    private lateinit var editGatewayKey: EditText
    private lateinit var editDeviceName: EditText
    private lateinit var btnSave: Button
    private lateinit var statusText: TextView
    private lateinit var statusSubText: TextView

    private val PERMISSION_REQUEST_CODE = 100

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // Version v1.1.0 is defined in activity_main.xml

        // Initialize UI
        editServerUrl = findViewById(R.id.editServerUrl)
        editGatewayKey = findViewById(R.id.editGatewayKey)
        editDeviceName = findViewById(R.id.editDeviceName)
        btnSave = findViewById(R.id.btnSave)
        statusText = findViewById(R.id.statusText)
        statusSubText = findViewById(R.id.statusSubText)

        // Load saved settings
        loadSettings()

        btnSave.setOnClickListener {
            saveSettingsAndStart()
        }

        // Update UI status based on whether service is active
        updateStatus()
    }

    private fun loadSettings() {
        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        editServerUrl.setText(prefs.getString("server_url", "http://192.168.1.10:3303"))
        editGatewayKey.setText(prefs.getString("gateway_key", "test_gateway_key"))
        editDeviceName.setText(prefs.getString("device_name", Build.MODEL))
    }

    private fun saveSettingsAndStart() {
        val serverUrl = editServerUrl.text.toString().trim()
        val gatewayKey = editGatewayKey.text.toString().trim()
        val deviceName = editDeviceName.text.toString().trim()

        if (serverUrl.isEmpty() || gatewayKey.isEmpty() || deviceName.isEmpty()) {
            Toast.makeText(this, "Lütfen tüm alanları doldurun!", Toast.LENGTH_SHORT).show()
            return
        }

        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("server_url", serverUrl)
            putString("gateway_key", gatewayKey)
            putString("device_name", deviceName)
            apply()
        }

        Toast.makeText(this, "Ayarlar kaydedildi.", Toast.LENGTH_SHORT).show()

        if (checkAndRequestPermissions()) {
            startGatewayService()
        }
    }

    private fun checkAndRequestPermissions(): Boolean {
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
            return false
        }
        return true
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
