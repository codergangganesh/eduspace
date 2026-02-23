package com.eduspace.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class CallNotificationService extends FirebaseMessagingService {

    private static final String TAG = "CallNotificationService";
    private static final String CHANNEL_ID = "eduspace_calls_v2";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "Incoming FCM: " + remoteMessage.getData());

        if (remoteMessage.getData().size() > 0) {
            Map<String, String> data = remoteMessage.getData();
            String type = data.get("type");

            if ("call".equals(type) || "video".equals(type) || "audio".equals(type) || "incoming_call".equals(type)) {
                handleIncomingCall(data);
            }
        }
    }

    private void handleIncomingCall(Map<String, String> data) {
        String callerName = data.get("callerName");
        String sessionId = data.get("sessionId");
        String callType = data.get("callType");
        String callerAvatar = data.get("callerAvatar");
        
        Context context = getApplicationContext();

        // 1. Prepare Full Screen Intent
        Intent fullScreenIntent = new Intent(context, IncomingCallActivity.class);
        fullScreenIntent.putExtra("callerName", callerName);
        fullScreenIntent.putExtra("sessionId", sessionId);
        fullScreenIntent.putExtra("callType", callType);
        fullScreenIntent.putExtra("callerAvatar", callerAvatar);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                fullScreenIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0)
        );

        // 2. Build Notification
        createNotificationChannel();

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle("Incoming " + (callType != null ? callType : "Call"))
                .setContentText(callerName + " is calling...")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setOngoing(true) // Force staying in overlay
                .setFullScreenIntent(fullScreenPendingIntent, true);

        // 3. Show Notification
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.notify(1001, notificationBuilder.build());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Incoming Calls",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Critical alerts for incoming calls");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), audioAttributes);
            channel.enableVibration(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);
        // Capacitor Push Plugin handles saving this mostly, but if we wanted to save specifically:
        // sendRegistrationToServer(token);
        // Since both this Service and Capacitor's service might run, we let Capacitor handle the token event if possible.
        // Or we can broadcast it to JS.
    }
}
