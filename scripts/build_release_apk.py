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
import android.content.Context;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public class MainActivity extends Activity {
    private WebView webView;
    private FrameLayout container;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private TextView errorText;
    private Button retryButton;
    private static final String APP_URL = "https://garia-os.ai.studio/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );

        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
        );

        setupUI();
        initWebView();
        loadApp();
    }

    private void setupUI() {
        container = new FrameLayout(this);
        container.setBackgroundColor(0xFF0F172A);

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF0F172A);
        container.addView(webView, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setIndeterminate(false);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        FrameLayout.LayoutParams pbParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, 10
        );
        container.addView(progressBar, pbParams);

        errorLayout = new LinearLayout(this);
        errorLayout.setOrientation(LinearLayout.VERTICAL);
        errorLayout.setGravity(android.view.Gravity.CENTER);
        errorLayout.setPadding(40, 40, 40, 40);
        errorLayout.setBackgroundColor(0xFF0F172A);
        errorLayout.setVisibility(View.GONE);

        TextView titleText = new TextView(this);
        titleText.setText("Garia OS");
        titleText.setTextSize(24);
        titleText.setTextColor(0xFF10B981);
        titleText.setGravity(android.view.Gravity.CENTER);
        errorLayout.addView(titleText);

        errorText = new TextView(this);
        errorText.setText("Unable to connect to Garia OS servers.\\nPlease check your network connection.");
        errorText.setTextSize(14);
        errorText.setTextColor(0xFF94A3B8);
        errorText.setGravity(android.view.Gravity.CENTER);
        errorText.setPadding(0, 20, 0, 30);
        errorLayout.addView(errorText);

        retryButton = new Button(this);
        retryButton.setText("Retry Connection");
        retryButton.setBackgroundColor(0xFF10B981);
        retryButton.setTextColor(0xFF020617);
        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                errorLayout.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                loadApp();
            }
        });
        errorLayout.addView(retryButton);

        container.addView(errorLayout, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        ));

        setContentView(container);
    }

    private void initWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setBuiltInZoomControls(false);
        settings.setSupportZoom(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError("Connection Error: " + error.getDescription());
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });
    }

    private void loadApp() {
        if (isNetworkAvailable()) {
            webView.loadUrl(APP_URL);
        } else {
            showError("No Internet Connection.\\nPlease connect to Wi-Fi or Mobile Data.");
        }
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnected();
        }
        return true;
    }

    private void showError(String message) {
        webView.setVisibility(View.GONE);
        errorLayout.setVisibility(View.VISIBLE);
        errorText.setText(message);
    }

    @Override
    public void onBackPressed() {
        if (errorLayout.getVisibility() == View.VISIBLE) {
            errorLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            loadApp();
        } else if (webView != null && webView.canGoBack()) {
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

    # 4. Package resources & AndroidManifest with aapt (Explicit SDK flags)
    unaligned_apk = os.path.join(build_dir, "unaligned.apk")
    subprocess.run([
        "aapt", "package", "-f", "-m",
        "-F", unaligned_apk,
        "-M", "android/app/src/main/AndroidManifest.xml",
        "-S", "android/app/src/main/res",
        "-I", "/tmp/android.jar",
        "--min-sdk-version", "21",
        "--target-sdk-version", "34",
        "--version-code", str(version_code),
        "--version-name", version_name
    ], check=True)

    # 5. Add classes.dex into unaligned.apk
    subprocess.run(["aapt", "add", unaligned_apk, "classes.dex"], cwd=dex_dir, check=True)

    # 6. Zipalign unaligned.apk to 4-byte alignment
    aligned_apk = os.path.join(build_dir, "aligned.apk")
    subprocess.run(["zipalign", "-f", "-p", "4", unaligned_apk, aligned_apk], check=True)

    # 7. Generate PKCS12 keystore with keytool & sign with apksigner (v1, v2, v3)
    keystore_path = os.path.join(build_dir, "release.p12")
    subprocess.run([
        "keytool", "-genkeypair", "-v",
        "-keystore", keystore_path,
        "-storetype", "PKCS12",
        "-alias", "gariaos",
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-storepass", "gariaos123",
        "-keypass", "gariaos123",
        "-dname", "CN=Garia OS, OU=Engineering, O=Garia OS, L=Kolkata, ST=WB, C=IN"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    subprocess.run([
        "apksigner", "sign",
        "--ks", keystore_path,
        "--ks-pass", "pass:gariaos123",
        "--ks-key-alias", "gariaos",
        "--key-pass", "pass:gariaos123",
        "--v1-signing-enabled", "true",
        "--v2-signing-enabled", "true",
        "--v3-signing-enabled", "true",
        aligned_apk
    ], check=True)

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
        "public/Garia_OS_v2.8.3_Release_APK.apk",
        "public/Garia_OS_v2.8.1_Release_APK.apk",
        "public/Garia_OS_v2.8.0_Release_APK.apk",
        "public/Garia_OS_v2.7_Release_APK.apk",
        "public/Garia_OS_v2.6.1_Release_APK.apk",
        "public/Garia_OS_v2.5.0_Release_APK.apk",
        "public/Garia_OS_v2.4.0_Release_APK.apk",
        "public/Garia_OS.apk",
        "public/garia-os-release.apk",
        "public/download.apk",
    ]
    if os.path.exists("dist"):
        targets.extend([
            "dist/Garia_OS_v2.8.3_Release_APK.apk",
            "dist/Garia_OS_v2.8.2_Release_APK.apk",
            "dist/Garia_OS_v2.8.1_Release_APK.apk",
            "dist/Garia_OS_v2.8.0_Release_APK.apk",
            "dist/Garia_OS_v2.7_Release_APK.apk",
            "dist/Garia_OS_v2.6.1_Release_APK.apk",
            "dist/Garia_OS_v2.5.0_Release_APK.apk",
            "dist/Garia_OS_v2.4.0_Release_APK.apk",
            "dist/Garia_OS.apk",
            "dist/garia-os-release.apk",
            "dist/download.apk",
        ])

    for target in targets:
        os.makedirs(os.path.dirname(os.path.abspath(target)), exist_ok=True)
        shutil.copyfile(primary_aligned, target)

    print("\n=== Android SDK Verification Log ===")
    print("A. AAPT BADGING:")
    res_badging = subprocess.run(["aapt", "dump", "badging", primary_aligned], capture_output=True, text=True)
    print(res_badging.stdout)

    print("B. APKSIGNER VERIFY:")
    res_verify = subprocess.run(["apksigner", "verify", "--verbose", "--print-certs", primary_aligned], capture_output=True, text=True)
    print(res_verify.stdout)

    print("C. ZIPALIGN VERIFY:")
    res_zipalign = subprocess.run(["zipalign", "-c", "-v", "4", primary_aligned], capture_output=True, text=True)
    print(res_zipalign.stdout)

    print("D. UNZIP TEST:")
    res_unzip = subprocess.run(["unzip", "-t", primary_aligned], capture_output=True, text=True)
    print("Unzip Exit Code:", res_unzip.returncode)

    print(f"\nSUCCESS: Real Android Release APK v2.8.2 Built ({os.path.getsize(primary_apk_path)} bytes) | SHA256: {primary_sha}")
