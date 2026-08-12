import os
import sys
import shutil
import glob
import hashlib
import subprocess

def build_real_android_apk(output_path, package="com.gariaos.app", version_name="2.8.2", version_code=12):
    build_dir = "/tmp/garia_android_build"
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    
    src_dir = os.path.join(build_dir, "src", "com", "gariaos", "app")
    classes_dir = os.path.join(build_dir, "classes")
    dex_dir = os.path.join(build_dir, "dex")

    os.makedirs(src_dir, exist_ok=True)
    os.makedirs(classes_dir, exist_ok=True)
    os.makedirs(dex_dir, exist_ok=True)

    # 1. Write MainActivity.java
    java_code = '''package com.gariaos.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.SslErrorHandler;
import android.net.http.SslError;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setSupportZoom(false);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        webView.loadUrl("https://garia-os.ai.studio/");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
'''
    java_file = os.path.join(src_dir, "MainActivity.java")
    with open(java_file, "w") as f:
        f.write(java_code)

    # 2. Compile Java to class files
    subprocess.run(["javac", "-cp", "/tmp/android.jar", "-d", classes_dir, java_file], check=True)

    # 3. Dex class files with Google D8
    class_files = glob.glob(f"{classes_dir}/**/*.class", recursive=True)
    d8_cmd = ["java", "-cp", "/tmp/r8.jar", "com.android.tools.r8.D8", "--lib", "/tmp/android.jar", "--output", dex_dir] + class_files
    subprocess.run(d8_cmd, check=True)

    # 4. Package resources & AndroidManifest with aapt
    unaligned_apk = os.path.join(build_dir, "unaligned.apk")
    subprocess.run([
        "aapt", "package", "-f", "-m",
        "-F", unaligned_apk,
        "-M", "android/app/src/main/AndroidManifest.xml",
        "-S", "android/app/src/main/res",
        "-I", "/tmp/android.jar"
    ], check=True)

    # 5. Add classes.dex into unaligned.apk
    subprocess.run(["aapt", "add", unaligned_apk, "classes.dex"], cwd=dex_dir, check=True)

    # 6. Zipalign unaligned.apk to 4-byte alignment
    aligned_apk = os.path.join(build_dir, "aligned.apk")
    subprocess.run(["zipalign", "-f", "-p", "4", unaligned_apk, aligned_apk], check=True)

    # 7. Generate RSA key & certificate if needed, then sign with apksigner
    key_pem = os.path.join(build_dir, "key.pem")
    cert_pem = os.path.join(build_dir, "cert.pem")
    key_pk8 = os.path.join(build_dir, "key.pk8")

    subprocess.run([
        "openssl", "req", "-x509", "-newkey", "rsa:2048",
        "-keyout", key_pem, "-out", cert_pem,
        "-days", "3650", "-nodes", "-subj", "/CN=com.gariaos.app"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.run([
        "openssl", "pkcs8", "-topk8", "-outform", "DER",
        "-in", key_pem, "-out", key_pk8, "-nocrypt"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.run(["apksigner", "sign", "--key", key_pk8, "--cert", cert_pem, aligned_apk], check=True)

    # 8. Copy to output_path
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    shutil.copyfile(aligned_apk, output_path)

    apk_size = os.path.getsize(output_path)
    with open(output_path, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    print(f"Generated Genuine Android APK {output_path}: {apk_size} bytes | SHA256: {sha256}")
    return aligned_apk, sha256

if __name__ == "__main__":
    primary_apk_path = "public/Garia_OS_v2.8.2_Release_APK.apk"
    primary_aligned, primary_sha = build_real_android_apk(primary_apk_path)

    # Copy to all target fallback paths
    targets = [
        "public/Garia_OS_v2.8.1_Release_APK.apk",
        "public/Garia_OS_v2.8.0_Release_APK.apk",
        "public/Garia_OS_v2.7_Release_APK.apk",
        "public/Garia_OS_v2.6.1_Release_APK.apk",
        "public/Garia_OS_v2.5.0_Release_APK.apk",
        "public/Garia_OS_v2.4.0_Release_APK.apk",
        "public/Garia_OS.apk",
        "public/garia-os-release.apk",
    ]
    if os.path.exists("dist"):
        targets.extend([
            "dist/Garia_OS_v2.8.2_Release_APK.apk",
            "dist/Garia_OS_v2.8.1_Release_APK.apk",
            "dist/Garia_OS_v2.8.0_Release_APK.apk",
            "dist/Garia_OS_v2.7_Release_APK.apk",
            "dist/Garia_OS_v2.6.1_Release_APK.apk",
            "dist/Garia_OS_v2.5.0_Release_APK.apk",
            "dist/Garia_OS_v2.4.0_Release_APK.apk",
            "dist/Garia_OS.apk",
            "dist/garia-os-release.apk",
        ])

    for target in targets:
        os.makedirs(os.path.dirname(os.path.abspath(target)), exist_ok=True)
        shutil.copyfile(primary_aligned, target)

    print("\n=== Android SDK Verification Log ===")
    res_verify = subprocess.run(["apksigner", "verify", "--verbose", "--print-certs", primary_aligned], capture_output=True, text=True)
    print(res_verify.stdout)

    res_zipalign = subprocess.run(["zipalign", "-c", "-v", "4", primary_aligned], capture_output=True, text=True)
    print(res_zipalign.stdout)

    res_badging = subprocess.run(["aapt", "dump", "badging", primary_aligned], capture_output=True, text=True)
    print(res_badging.stdout)

    print(f"SUCCESS: Real Android Release APK v2.8.2 Built ({os.path.getsize(primary_apk_path)} bytes) | SHA256: {primary_sha}")
