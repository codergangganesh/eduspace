package com.eduspace.app;

import android.app.KeyguardManager;
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
import android.os.AsyncTask;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import androidx.appcompat.app.AppCompatActivity;

public class IncomingCallActivity extends AppCompatActivity {

    private MediaPlayer mediaPlayer;
    private String callerAvatar;
    private String sessionId;
    private String callerName;
    private String callerId;
    private String callType;

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
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                finish();
            }
        }, 45000);
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

        // Launch Main Activity with Deep Link
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        // Deep link for Capacitor to handle - this will trigger App.addListener('appUrlOpen')
        String deepLinkUrl = "https://eduspace-five.vercel.app/messages?session=" + sessionId + "&action=accept";
        intent.setData(Uri.parse(deepLinkUrl));
        intent.setAction(Intent.ACTION_VIEW);
        
        startActivity(intent);
        finish();
    }

    private void rejectCall() {
        stopRingtone();
        // Here we ideally call an endpoint to reject.
        // For now, just close.
        finish();
    }

    @Override
    protected void onDestroy() {
        stopRingtone();
        super.onDestroy();
    }
}
