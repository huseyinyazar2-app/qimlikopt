package com.qimlik.gateway

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class SettingsActivity : AppCompatActivity() {

    private lateinit var editServerUrl: EditText
    private lateinit var editGatewayKey: EditText
    private lateinit var editDeviceName: EditText
    private lateinit var btnSave: Button
    private lateinit var btnCancelSettings: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        // View Bindings
        editServerUrl = findViewById(R.id.editServerUrl)
        editGatewayKey = findViewById(R.id.editGatewayKey)
        editDeviceName = findViewById(R.id.editDeviceName)
        btnSave = findViewById(R.id.btnSave)
        btnCancelSettings = findViewById(R.id.btnCancelSettings)

        // Load Preferences
        loadPreferences()

        // Button Actions
        btnSave.setOnClickListener { saveSettingsAndExit() }
        btnCancelSettings.setOnClickListener { cancelAndExit() }
    }

    private fun loadPreferences() {
        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        editServerUrl.setText(prefs.getString("server_url", "https://api.qimlik.com"))
        editGatewayKey.setText(prefs.getString("gateway_key", ""))
        editDeviceName.setText(prefs.getString("device_name", Build.MODEL))
    }

    private fun saveSettingsAndExit() {
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

        hideKeyboard()
        Toast.makeText(this, "Ayarlar başarıyla kaydedildi.", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun cancelAndExit() {
        val prefs = getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", null)

        if (serverUrl == null) {
            Toast.makeText(this, "Lütfen kurulum yapın!", Toast.LENGTH_SHORT).show()
        } else {
            hideKeyboard()
            finish()
        }
    }

    private fun hideKeyboard() {
        val view = this.currentFocus
        if (view != null) {
            val imm = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
            imm.hideSoftInputFromWindow(view.windowToken, 0)
            view.clearFocus()
        }
    }
}
