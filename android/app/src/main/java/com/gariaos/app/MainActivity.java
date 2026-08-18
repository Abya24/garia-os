package com.gariaos.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final String TAG = "GariaOS";
    private static final String APP_VERSION = "3.0.0 (30001)";
    private static final String REMOTE_APP_URL = "https://garia-os.ai.studio/";
    private static final String LOCAL_ASSET_URL = "file:///android_asset/index.html";

    private FrameLayout rootLayout;
    private WebView webView;
    private FrameLayout splashLayout;
    private ProgressBar splashProgressBar;
    private LinearLayout errorLayout;
    private TextView errorTitleText;
    private TextView errorDetailText;
    private TextView diagnosticLogsView;
    private Button retryButton;
    private final StringBuilder runtimeLogs = new StringBuilder();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Global Uncaught Exception Handler to capture fatal startup crashes
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(Thread thread, Throwable throwable) {
                logDiagnostic("FATAL", "Uncaught exception on thread: " + thread.getName(), throwable);
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        surfaceInitializationError("Fatal Runtime Exception", throwable);
                    }
                });
            }
        });

        logDiagnostic("INFO", "========================================================");
        logDiagnostic("INFO", "🚀 Garia OS MainActivity Initializing...");
        logDiagnostic("INFO", "   Version: " + APP_VERSION);
        logDiagnostic("INFO", "   Device: " + Build.MANUFACTURER + " " + Build.MODEL + " (" + Build.DEVICE + ")");
        logDiagnostic("INFO", "   Android OS: " + Build.VERSION.RELEASE + " (SDK " + Build.VERSION.SDK_INT + ")");
        logDiagnostic("INFO", "   ABI: " + (Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "unknown"));

        // Inspect Launching Intent
        Intent intent = getIntent();
        if (intent != null) {
            logDiagnostic("INFO", "   Intent Action: " + intent.getAction());
            logDiagnostic("INFO", "   Intent Data: " + intent.getDataString());
            logDiagnostic("INFO", "   Intent Categories: " + (intent.getCategories() != null ? intent.getCategories().toString() : "none"));
        } else {
            logDiagnostic("WARN", "   Intent is null");
        }
        logDiagnostic("INFO", "========================================================");

        try {
            // Configure Window Parameters
            try {
                requestWindowFeature(Window.FEATURE_NO_TITLE);
                getWindow().setFlags(
                    WindowManager.LayoutParams.FLAG_FULLSCREEN,
                    WindowManager.LayoutParams.FLAG_FULLSCREEN
                );
                logDiagnostic("INFO", "Window flags configured successfully.");
            } catch (Exception e) {
                logDiagnostic("WARN", "Non-critical error setting window flags", e);
            }

            // Step 1: Build User Interface
            logDiagnostic("INFO", "Building UI layouts...");
            buildUserInterface();
            logDiagnostic("INFO", "UI layout created successfully.");

            // Step 2: Configure WebView Engine
            logDiagnostic("INFO", "Configuring WebView parameters...");
            configureWebView();
            logDiagnostic("INFO", "WebView engine ready.");

            // Step 3: Launch Application
            logDiagnostic("INFO", "Triggering application load...");
            launchApplication();

        } catch (Throwable t) {
            logDiagnostic("ERROR", "CRITICAL: Initialization failure in onCreate", t);
            surfaceInitializationError("Application Initialization Failed", t);
        }
    }

    private void logDiagnostic(String level, String message) {
        logDiagnostic(level, message, null);
    }

    private void logDiagnostic(String level, String message, Throwable t) {
        String timestamp = new SimpleDateFormat("HH:mm:ss.SSS", Locale.US).format(new Date());
        String logEntry = "[" + timestamp + "] [" + level + "] " + message;
        
        if ("ERROR".equals(level) || "FATAL".equals(level)) {
            Log.e(TAG, message, t);
        } else if ("WARN".equals(level)) {
            Log.w(TAG, message, t);
        } else {
            Log.i(TAG, message);
        }

        synchronized (runtimeLogs) {
            runtimeLogs.append(logEntry).append("\n");
            if (t != null) {
                StringWriter sw = new StringWriter();
                t.printStackTrace(new PrintWriter(sw));
                runtimeLogs.append(sw.toString()).append("\n");
            }
        }
    }

    private void buildUserInterface() {
        rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#090D16"));

        // 1. Core Native/Hybrid WebView
        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#090D16"));
        rootLayout.addView(webView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // 2. Native Splash & Progress Screen
        splashLayout = new FrameLayout(this);
        splashLayout.setBackgroundColor(Color.parseColor("#090D16"));

        LinearLayout splashContent = new LinearLayout(this);
        splashContent.setOrientation(LinearLayout.VERTICAL);
        splashContent.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams contentParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
        );
        splashLayout.addView(splashContent, contentParams);

        TextView logoTitle = new TextView(this);
        logoTitle.setText("GARIA OS");
        logoTitle.setTextColor(Color.parseColor("#10B981")); // Emerald 500
        logoTitle.setTextSize(32);
        logoTitle.setTypeface(Typeface.DEFAULT_BOLD);
        logoTitle.setGravity(Gravity.CENTER);
        splashContent.addView(logoTitle);

        TextView subTitle = new TextView(this);
        subTitle.setText("AI Student Operating System • v3.0.0");
        subTitle.setTextColor(Color.parseColor("#94A3B8")); // Slate 400
        subTitle.setTextSize(14);
        subTitle.setGravity(Gravity.CENTER);
        subTitle.setPadding(0, 8, 0, 24);
        splashContent.addView(subTitle);

        splashProgressBar = new ProgressBar(this);
        splashContent.addView(splashProgressBar);

        rootLayout.addView(splashLayout, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        // 3. Diagnostics & Error Recovery Surface
        errorLayout = new LinearLayout(this);
        errorLayout.setOrientation(LinearLayout.VERTICAL);
        errorLayout.setGravity(Gravity.CENTER_HORIZONTAL);
        errorLayout.setBackgroundColor(Color.parseColor("#090D16"));
        errorLayout.setPadding(32, 48, 32, 32);
        errorLayout.setVisibility(View.GONE);

        errorTitleText = new TextView(this);
        errorTitleText.setText("Startup Diagnostic Notice");
        errorTitleText.setTextColor(Color.parseColor("#EF4444")); // Red 500
        errorTitleText.setTextSize(22);
        errorTitleText.setTypeface(Typeface.DEFAULT_BOLD);
        errorTitleText.setGravity(Gravity.CENTER);
        errorLayout.addView(errorTitleText);

        errorDetailText = new TextView(this);
        errorDetailText.setText("Initialization encountered an issue.");
        errorDetailText.setTextColor(Color.parseColor("#E2E8F0"));
        errorDetailText.setTextSize(14);
        errorDetailText.setPadding(0, 16, 0, 16);
        errorLayout.addView(errorDetailText);

        // Scrollable Log Console
        ScrollView logScrollView = new ScrollView(this);
        LinearLayout.LayoutParams logScrollParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            0,
            1.0f
        );
        logScrollParams.setMargins(0, 8, 0, 16);
        logScrollView.setLayoutParams(logScrollParams);
        logScrollView.setBackgroundColor(Color.parseColor("#0F172A"));
        logScrollView.setPadding(16, 16, 16, 16);

        diagnosticLogsView = new TextView(this);
        diagnosticLogsView.setTextColor(Color.parseColor("#38BDF8")); // Sky 400
        diagnosticLogsView.setTextSize(11);
        diagnosticLogsView.setTypeface(Typeface.MONOSPACE);
        logScrollView.addView(diagnosticLogsView);
        errorLayout.addView(logScrollView);

        LinearLayout buttonRow = new LinearLayout(this);
        buttonRow.setOrientation(LinearLayout.HORIZONTAL);
        buttonRow.setGravity(Gravity.CENTER);

        retryButton = new Button(this);
        retryButton.setText("Reload App");
        retryButton.setBackgroundColor(Color.parseColor("#10B981"));
        retryButton.setTextColor(Color.parseColor("#090D16"));
        retryButton.setPadding(32, 16, 32, 16);
        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                errorLayout.setVisibility(View.GONE);
                splashLayout.setVisibility(View.VISIBLE);
                launchApplication();
            }
        });
        buttonRow.addView(retryButton);

        Button loadLocalButton = new Button(this);
        loadLocalButton.setText("Force Offline Cache");
        loadLocalButton.setBackgroundColor(Color.parseColor("#3B82F6"));
        loadLocalButton.setTextColor(Color.WHITE);
        loadLocalButton.setPadding(32, 16, 32, 16);
        LinearLayout.LayoutParams localBtnParams = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        localBtnParams.setMargins(16, 0, 0, 0);
        loadLocalButton.setLayoutParams(localBtnParams);
        loadLocalButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                errorLayout.setVisibility(View.GONE);
                splashLayout.setVisibility(View.VISIBLE);
                webView.loadUrl(LOCAL_ASSET_URL);
            }
        });
        buttonRow.addView(loadLocalButton);

        errorLayout.addView(buttonRow);

        rootLayout.addView(errorLayout, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        setContentView(rootLayout);
    }

    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                logDiagnostic("DEBUG", "WebView Loading Progress: " + newProgress + "%");
                if (newProgress >= 90) {
                    splashLayout.setVisibility(View.GONE);
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                logDiagnostic("INFO", "shouldOverrideUrlLoading: " + url);
                if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file:///")) {
                    view.loadUrl(url);
                    return true;
                }
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                logDiagnostic("INFO", "onPageStarted: " + url);
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                logDiagnostic("INFO", "onPageFinished: " + url);
                super.onPageFinished(view, url);
                splashLayout.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                String errorMsg = (error != null) ? "ErrorCode: " + error.getErrorCode() + ", Desc: " + error.getDescription() : "Unknown";
                String reqUrl = (request != null && request.getUrl() != null) ? request.getUrl().toString() : "unknown";
                logDiagnostic("WARN", "WebView onReceivedError [" + reqUrl + "]: " + errorMsg);

                if (request != null && request.isForMainFrame()) {
                    logDiagnostic("INFO", "Main frame network failure. Falling back to local offline assets...");
                    view.loadUrl(LOCAL_ASSET_URL);
                }
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                logDiagnostic("WARN", "WebView SSL Error: " + (error != null ? error.toString() : "unknown"));
                handler.proceed();
            }
        });
    }

    private void launchApplication() {
        boolean online = isOnline();
        logDiagnostic("INFO", "Network Status: " + (online ? "ONLINE" : "OFFLINE"));

        if (online) {
            logDiagnostic("INFO", "Loading Remote Production Endpoint: " + REMOTE_APP_URL);
            webView.loadUrl(REMOTE_APP_URL);
        } else {
            logDiagnostic("INFO", "Loading Bundled Offline Web Application: " + LOCAL_ASSET_URL);
            webView.loadUrl(LOCAL_ASSET_URL);
        }
    }

    private boolean isOnline() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null) {
                NetworkInfo ni = cm.getActiveNetworkInfo();
                return ni != null && ni.isConnected();
            }
        } catch (Exception e) {
            logDiagnostic("WARN", "Error checking connectivity", e);
        }
        return false;
    }

    private void surfaceInitializationError(String title, Throwable t) {
        if (errorLayout != null) {
            errorTitleText.setText(title);
            if (t != null) {
                errorDetailText.setText(t.getClass().getSimpleName() + ": " + t.getMessage());
            }
            if (diagnosticLogsView != null) {
                synchronized (runtimeLogs) {
                    diagnosticLogsView.setText(runtimeLogs.toString());
                }
            }
            if (splashLayout != null) splashLayout.setVisibility(View.GONE);
            if (webView != null) webView.setVisibility(View.GONE);
            errorLayout.setVisibility(View.VISIBLE);
        }
    }

    @Override
    public void onBackPressed() {
        if (errorLayout != null && errorLayout.getVisibility() == View.VISIBLE) {
            errorLayout.setVisibility(View.GONE);
            if (webView != null) webView.setVisibility(View.VISIBLE);
            launchApplication();
        } else if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
