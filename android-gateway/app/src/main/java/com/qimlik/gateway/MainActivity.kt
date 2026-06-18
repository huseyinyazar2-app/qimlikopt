package com.qimlik.gateway

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Start the foreground service
        val serviceIntent = Intent(this, QimlikForegroundService::class.java)
        startForegroundService(serviceIntent)
        
        // Version v1.0.9 is defined in activity_main.xml
        // We keep the activity open so user can see the version at top left
    }
}
