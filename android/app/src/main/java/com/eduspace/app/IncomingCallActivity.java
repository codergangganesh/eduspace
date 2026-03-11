package com.eduspace.app;

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.InputStream;

import androidx.appcompat.app.AppCompatActivity;

public class IncomingCallActivity extends AppCompatActivity {

    private static final String APP_SCHEME = "eduspace";
    private static final String APP_HOST = "call";
    private static final int CALL_NOTIFICATION_ID = 1001;
    private static final long AUTO_DISMISS_MS = 45000L;

    private MediaPlayer mediaPlayer;
    private String callerAvatar;
    private String sessionId;
    private String callerName;
    private String callerId;
    private String callType;
    private String actionToken;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable autoDismissRunnable = new Runnable() {
        @Override
        public void run() {
            cancelIncomingCallNotification();
            finish();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Wake screen logic
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (keyguardManager != null) {
                keyguardManager.requestDismissKeyguard(this, null);
            }
        }
        
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);

        setContentView(R.layout.activity_incoming_call);

        // Get Data
        Intent intent = getIntent();
        sessionId = intent.getStringExtra("sessionId");
        callerName = intent.getStringExtra("callerName");
        callerId = intent.getStringExtra("callerId");
        callType = intent.getStringExtra("callType");
        callerAvatar = intent.getStringExtra("callerAvatar");
        actionToken = intent.getStringExtra("actionToken");

        // Set UI
        TextView tvCallerName = findViewById(R.id.callerName);
        TextView tvCallType = findViewById(R.id.callType);
        
        tvCallerName.setText(callerName != null ? callerName : "Unknown Caller");
        tvCallType.setText("Incoming " + (callType != null ? callType : "Voice") + " Call...");

        // Load Avatar
        if (callerAvatar != null && !callerAvatar.isEmpty()) {
            loadAvatar(callerAvatar);
        }

        // Play Ringtone
        playRingtone();

        // Buttons
        ImageButton btnAccept = findViewById(R.id.btnAccept);
        ImageButton btnReject = findViewById(R.id.btnReject);

        btnAccept.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                acceptCall();
            }
        });

        btnReject.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                rejectCall();
            }
        });

        // Auto-end after 45s if no answer
        handler.postDelayed(autoDismissRunnable, AUTO_DISMISS_MS);
    }

    private void loadAvatar(String url) {
         new Thread(() -> {
            try {
                InputStream in = new java.net.URL(url).openStream();
                final Bitmap bitmap = BitmapFactory.decodeStream(in);
                new Handler(Looper.getMainLooper()).post(() -> {
                    ImageView img = findViewById(R.id.callerAvatar);
                    if (img != null && bitmap != null) {
                        img.setImageBitmap(bitmap);
                    }
                });
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private void playRingtone() {
        try {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(this, ringtoneUri);
            mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .build()
            );
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopRingtone() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
            mediaPlayer = null;
        }
    }

    private void acceptCall() {
        stopRingtone();
        cancelIncomingCallNotification();

        if (sessionId == null || sessionId.isEmpty()) {
            finish();
            return;
        }

        dispatchNativeAction(IncomingCallActionReceiver.ACTION_ACCEPT_CALL);
    }

    private void rejectCall() {
        stopRingtone();
        cancelIncomingCallNotification();

        if (sessionId == null || sessionId.isEmpty()) {
            finish();
            return;
        }

        dispatchNativeAction(IncomingCallActionReceiver.ACTION_REJECT_CALL);
    }

    private void dispatchNativeAction(String action) {
        Intent intent = new Intent(this, IncomingCallActionReceiver.class);
        intent.setAction(action);
        intent.putExtra(IncomingCallActionReceiver.EXTRA_SESSION_ID, sessionId);
        intent.putExtra(IncomingCallActionReceiver.EXTRA_CALLER_ID, callerId);
        intent.putExtra(IncomingCallActionReceiver.EXTRA_CALLER_NAME, callerName);
        intent.putExtra(IncomingCallActionReceiver.EXTRA_CALL_TYPE, callType);
        intent.putExtra(IncomingCallActionReceiver.EXTRA_CALLER_AVATAR, callerAvatar);
        intent.putExtra(IncomingCallActionReceiver.EXTRA_ACTION_TOKEN, actionToken);
        sendBroadcast(intent);
        finish();
    }

    private void cancelIncomingCallNotification() {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(CALL_NOTIFICATION_ID);
        }
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(autoDismissRunnable);
        stopRingtone();
        super.onDestroy();
    }
}
