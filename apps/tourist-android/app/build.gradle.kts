plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

val releaseKeystorePath = System.getenv("SLOCO_TOURIST_UPLOAD_KEYSTORE")
val releaseKeystorePassword = System.getenv("SLOCO_TOURIST_UPLOAD_KEYSTORE_PASSWORD")
val releaseKeyAlias = System.getenv("SLOCO_TOURIST_UPLOAD_KEY_ALIAS")
val releaseKeyPassword = System.getenv("SLOCO_TOURIST_UPLOAD_KEY_PASSWORD")
val hasReleaseSigning = listOf(
    releaseKeystorePath,
    releaseKeystorePassword,
    releaseKeyAlias,
    releaseKeyPassword,
).all { !it.isNullOrBlank() }

android {
    namespace = "vn.sloco.tourist"
    compileSdk = 35

    defaultConfig {
        applicationId = "vn.sloco.tourist"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    flavorDimensions += "environment"

    productFlavors {
        create("local") {
            dimension = "environment"
            buildConfigField("String", "API_BASE_URL", "\"http://127.0.0.1:3000/api/v1\"")
            buildConfigField("String", "ENVIRONMENT", "\"local\"")
        }
        create("staging") {
            dimension = "environment"
            buildConfigField("String", "API_BASE_URL", "\"https://api-staging.sloco.vn/api/v1\"")
            buildConfigField("String", "ENVIRONMENT", "\"staging\"")
        }
        create("production") {
            dimension = "environment"
            buildConfigField("String", "API_BASE_URL", "\"https://api.sloco.vn/api/v1\"")
            buildConfigField("String", "ENVIRONMENT", "\"production\"")
        }
    }

    buildFeatures {
        buildConfig = true
        compose = true
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseKeystorePath!!)
                storePassword = releaseKeystorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        debug {
        }
        release {
            isMinifyEnabled = false
            if (hasReleaseSigning) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)

    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.4")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation(platform("com.google.firebase:firebase-bom:34.12.0"))
    implementation("com.google.firebase:firebase-messaging")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
    implementation("com.google.zxing:core:3.5.3")

    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
}
