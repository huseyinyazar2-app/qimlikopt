package com.qimlik.gateway

import android.content.Context
import android.util.Log
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Gelen SMS/WhatsApp mesajını backend'e GÜVENİLİR biçimde iletir.
 * WorkManager sayesinde:
 *  - Mesaj kalıcıdır: telefon çevrimdışıyken veya yeniden başlasa bile kaybolmaz.
 *  - Ağ bağlantısı gelince otomatik gönderilir (NetworkType.CONNECTED kısıtı).
 *  - Geçici hatalarda (ağ/5xx) üstel geri çekilmeyle yeniden denenir.
 */
class ForwardMessageWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {

    private val client = OkHttpClient()

    override fun doWork(): Result {
        val phone = inputData.getString(KEY_PHONE) ?: return Result.failure()
        val message = inputData.getString(KEY_MESSAGE) ?: return Result.failure()

        val prefs = applicationContext.getSharedPreferences("qimlik_gateway_prefs", Context.MODE_PRIVATE)
        val serverUrl = prefs.getString("server_url", null) ?: return Result.failure()
        val gatewayKey = prefs.getString("gateway_key", null) ?: return Result.failure()

        val json = JSONObject().apply {
            put("phone", phone)
            put("message", message)
        }
        val body = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
        val request = Request.Builder()
            .url("$serverUrl/api/gateway/receive")
            .header("x-gateway-key", gatewayKey)
            .post(body)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                when {
                    response.isSuccessful -> {
                        Log.d("QimlikGateway", "Mesaj iletildi: ${response.code}")
                        Result.success()
                    }
                    response.code in 500..599 -> {
                        // Sunucu geçici hatası → yeniden dene
                        Log.w("QimlikGateway", "Sunucu hatası ${response.code}, yeniden denenecek")
                        Result.retry()
                    }
                    else -> {
                        // 4xx (geçersiz prefix / yetkisiz anahtar): yeniden denemek anlamsız
                        Log.w("QimlikGateway", "Kalıcı hata ${response.code}, mesaj atlanıyor")
                        Result.failure()
                    }
                }
            }
        } catch (e: Exception) {
            // Ağ/bağlantı hatası → yeniden dene
            Log.e("QimlikGateway", "İletim hatası, yeniden denenecek: ${e.message}")
            Result.retry()
        }
    }

    companion object {
        private const val KEY_PHONE = "phone"
        private const val KEY_MESSAGE = "message"

        fun enqueue(context: Context, phone: String, message: String) {
            val data = workDataOf(KEY_PHONE to phone, KEY_MESSAGE to message)
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val work = OneTimeWorkRequestBuilder<ForwardMessageWorker>()
                .setInputData(data)
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
                .build()
            WorkManager.getInstance(context.applicationContext).enqueue(work)
        }
    }
}
