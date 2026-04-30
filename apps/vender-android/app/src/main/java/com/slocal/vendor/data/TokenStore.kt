package com.slocal.vendor.data

import android.content.Context

class TokenStore(context: Context) {
    private val preferences = context.getSharedPreferences("vendor-auth", Context.MODE_PRIVATE)

    var accessToken: String?
        get() = preferences.getString("access_token", null)
        set(value) {
            preferences.edit().apply {
                if (value == null) remove("access_token") else putString("access_token", value)
            }.apply()
        }

    var refreshToken: String?
        get() = preferences.getString("refresh_token", null)
        set(value) {
            preferences.edit().apply {
                if (value == null) remove("refresh_token") else putString("refresh_token", value)
            }.apply()
        }

    fun clear() {
        preferences.edit().clear().apply()
    }
}
