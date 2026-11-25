package com.gelm.musica;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

public class PlaybackService extends Service {
  private static final String CH = "gelm_playback";
  private static final int ID = 4242;
  private PowerManager.WakeLock wl;

  @Override public int onStartCommand(Intent intent, int flags, int startId) {
    if (Build.VERSION.SDK_INT >= 26) {
      NotificationManager nm = getSystemService(NotificationManager.class);
      if (nm != null && nm.getNotificationChannel(CH) == null) {
        nm.createNotificationChannel(new NotificationChannel(CH, "Reproducción", NotificationManager.IMPORTANCE_LOW));
      }
    }

    PendingIntent pi = PendingIntent.getActivity(this, 0,
        new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);

    Notification.Builder b = Build.VERSION.SDK_INT >= 26
        ? new Notification.Builder(this, CH)
        : new Notification.Builder(this);
    Notification n = b
        .setContentTitle("GELM Música")
        .setContentText("Reproduciendo")
        .setSmallIcon(android.R.drawable.ic_media_play)
        .setContentIntent(pi)
        .setOngoing(true)
        .build();

    startForeground(ID, n);

    PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
    if (wl == null && pm != null) wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "gelm:audio");
    if (wl != null && !wl.isHeld()) wl.acquire(4 * 60 * 60 * 1000L);
    return START_STICKY;
  }

  @Override public void onDestroy() {
    if (wl != null && wl.isHeld()) wl.release();
    super.onDestroy();
  }

  @Override public IBinder onBind(Intent i) { return null; }
}
