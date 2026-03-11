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

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.Person;

import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import android.os.Bundle;
import java.util.Map;

public class CallNotificationService extends FirebaseMessagingService {

    private static final String TAG = "CallNotificationService";
    private static final String CHANNEL_ID = "eduspace_calls_v2";
    private static final int CALL_NOTIFICATION_ID = 1001;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "Incoming FCM: " + remoteMessage.getData());

        if (remoteMessage.getData().isEmpty()) {
            PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
            return;
        }

        Map<String, String> data = remoteMessage.getData();
        String type = data.get("type");

        if (isIncomingCall(type)) {
            if (isAppInForeground()) {
                // Preserve the in-app flow when the WebView is already active.
                PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
                return;
            }

            handleIncomingCall(data);
            return;
        }

        PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
    }

    private void handleIncomingCall(Map<String, String> data) {
        String callerName = data.get("callerName");
        String sessionId = data.get("sessionId");
        String callType = data.get("callType");
        String callerAvatar = data.get("callerAvatar");
        String callerId = data.get("callerId");
        String actionToken = data.get("actionToken");
        String safeCallerName = callerName != null && !callerName.isEmpty() ? callerName : "Someone";
        String safeCallType = callType != null && !callType.isEmpty() ? callType : "Call";

        Context context = getApplicationContext();
        Bundle extras = createCallExtras(sessionId, callerId, safeCallerName, safeCallType, callerAvatar, actionToken);

        // Full-screen activity used when Android allows heads-up / full-screen call UI.
        Intent fullScreenIntent = new Intent(context, IncomingCallActivity.class);
        fullScreenIntent.putExtras(extras);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            0,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        PendingIntent answerPendingIntent = IncomingCallActionReceiver.createActionPendingIntent(
            context,
            IncomingCallActionReceiver.ACTION_ACCEPT_CALL,
            extras
        );

        PendingIntent rejectPendingIntent = IncomingCallActionReceiver.createActionPendingIntent(
            context,
            IncomingCallActionReceiver.ACTION_REJECT_CALL,
            extras
        );

        createNotificationChannel();

        Person caller = new Person.Builder()
            .setName(safeCallerName)
            .build();

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Incoming " + safeCallType)
            .setContentText(safeCallerName + " is calling...")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(false)
            .setOngoing(true)
            .setTimeoutAfter(45000)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setStyle(NotificationCompat.CallStyle.forIncomingCall(caller, rejectPendingIntent, answerPendingIntent));

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(CALL_NOTIFICATION_ID, notificationBuilder.build());
        }

        IncomingCallActionReceiver.scheduleMissedCallTimeout(context, extras);
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
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "Refreshed token: " + token);
        PushNotificationsPlugin.onNewToken(token);
    }

    private boolean isIncomingCall(String type) {
        return "call".equals(type) || "video".equals(type) || "audio".equals(type) || "incoming_call".equals(type);
    }

    private boolean isAppInForeground() {
        return MainActivity.isAppVisible();
    }

    private Bundle createCallExtras(
        String sessionId,
        String callerId,
        String callerName,
        String callType,
        String callerAvatar,
        String actionToken
    ) {
        Bundle extras = new Bundle();
        extras.putString(IncomingCallActionReceiver.EXTRA_SESSION_ID, sessionId);
        extras.putString(IncomingCallActionReceiver.EXTRA_CALLER_ID, callerId);
        extras.putString(IncomingCallActionReceiver.EXTRA_CALLER_NAME, callerName);
        extras.putString(IncomingCallActionReceiver.EXTRA_CALL_TYPE, callType);
        extras.putString(IncomingCallActionReceiver.EXTRA_CALLER_AVATAR, callerAvatar);
        extras.putString(IncomingCallActionReceiver.EXTRA_ACTION_TOKEN, actionToken);
        return extras;
    }
}
