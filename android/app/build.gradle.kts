import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

val keystoreFile = file("keystore.jks")
val envPassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
val envAlias = System.getenv("ANDROID_KEY_ALIAS")
val envKeyPassword = System.getenv("ANDROID_KEY_PASSWORD")
val local = Properties()
val localFile = rootProject.file("keystore.properties")
if (localFile.exists()) localFile.inputStream().use { local.load(it) }

android {
    namespace = "com.aihypetycoon.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aihypetycoon.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        vectorDrawables.useSupportLibrary = true
    }

    signingConfigs {
        create("release") {
            if (keystoreFile.exists() && !envPassword.isNullOrBlank()) {
                storeFile = keystoreFile
                storePassword = envPassword
                keyAlias = envAlias ?: "upload"
                keyPassword = envKeyPassword ?: envPassword
            } else if (localFile.exists()) {
                storeFile = file(local.getProperty("storeFile") ?: "keystore.jks")
                storePassword = local.getProperty("storePassword")
                keyAlias = local.getProperty("keyAlias")
                keyPassword = local.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            val cfg = signingConfigs.getByName("release")
            signingConfig = if (cfg.storeFile != null && cfg.storeFile!!.exists()) {
                cfg
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures { compose = true }
    packaging { resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" } }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.core:core-ktx:1.15.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
}
