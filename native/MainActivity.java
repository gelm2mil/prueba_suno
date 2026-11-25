package com.gelm.musica;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    WebView wv = getBridge().getWebView();
    wv.getSettings().setMediaPlaybackRequiresUserGesture(false);
    wv.getSettings().setDomStorageEnabled(true);
    wv.addJavascriptInterface(new Bridge(), "NativePlayer");
    if (Build.VERSION.SDK_INT >= 33)
      requestPermissions(new String[]{ android.Manifest.permission.POST_NOTIFICATIONS }, 1);
  }

  public class Bridge {
    @JavascriptInterface public void play() {
      Intent i = new Intent(MainActivity.this, PlaybackService.class);
      if (Build.VERSION.SDK_INT >= 26) startForegroundService(i); else startService(i);
    }
    @JavascriptInterface public void pause() {
      stopService(new Intent(MainActivity.this, PlaybackService.class));
    }
  }
}
