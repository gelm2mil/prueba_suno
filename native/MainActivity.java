package com.gelm.musica;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    try {
      WebView wv = getBridge().getWebView();
      if (wv != null) {
        WebSettings st = wv.getSettings();
        st.setMediaPlaybackRequiresUserGesture(false);
        st.setDomStorageEnabled(true);
        st.setJavaScriptEnabled(true);
        wv.addJavascriptInterface(new Bridge(), "NativePlayer");
      }
    } catch (Exception e) { }
    if (Build.VERSION.SDK_INT >= 33) {
      try {
        requestPermissions(new String[]{ Manifest.permission.POST_NOTIFICATIONS }, 1);
      } catch (Exception e) { }
    }
  }

  public class Bridge {
    @JavascriptInterface public void play() {
      try {
        Intent i = new Intent(MainActivity.this, PlaybackService.class);
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i);
        else startService(i);
      } catch (Exception e) { }
    }
    @JavascriptInterface public void pause() {
      try { stopService(new Intent(MainActivity.this, PlaybackService.class)); } catch (Exception e) { }
    }
  }
}
