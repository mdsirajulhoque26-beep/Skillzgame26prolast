plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val webAppUrl = (project.findProperty("WEB_APP_URL") as String?)
    ?.trim()
    ?.takeIf { it.isNotBlank() }
    ?: "https://YOUR-SKILLZGAME-DOMAIN.example"

android {
    namespace = "com.skillzbase.skillzgame"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.skillzbase.skillzgame"
        minSdk = 23
        targetSdk = 35
        versionCode = (project.findProperty("VERSION_CODE") as String?)?.toIntOrNull() ?: 1
        versionName = (project.findProperty("VERSION_NAME") as String?)?.takeIf { it.isNotBlank() } ?: "1.0.0"
        buildConfigField("String", "WEB_APP_URL", "\"${webAppUrl.replace("\\", "\\\\").replace("\"", "\\\"")}\"")
    }

    buildFeatures {
        buildConfig = true
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
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.10.0")
}
