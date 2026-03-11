package com.eduspace.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

public class IncomingCallActionReceiver extends BroadcastReceiver {

    private static final String TAG = "IncomingCallAction";
    private static final String APP_SCHEME = "eduspace";
    private static final String APP_HOST = "call";
    private static final int CALL_NOTIFICATION_ID = 1001;
    private static final long MISSED_CALL_DELAY_MS = 45000L;

    public static final String ACTION_ACCEPT_CALL = "com.eduspace.app.ACTION_ACCEPT_CALL";
    public static final String ACTION_REJECT_CALL = "com.eduspace.app.ACTION_REJECT_CALL";
    public static final String ACTION_MISSED_CALL = "com.eduspace.app.ACTION_MISSED_CALL";

    public static final String EXTRA_SESSION_ID = "sessionId";
    public static final String EXTRA_CALLER_ID = "callerId";
    public static final String EXTRA_CALLER_NAME = "callerName";
    public static final String EXTRA_CALL_TYPE = "callType";
    public static final String EXTRA_CALLER_AVATAR = "callerAvatar";
    public static final String EXTRA_ACTION_TOKEN = "actionToken";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        final String receiverAction = intent.getAction();
        final String sessionId = intent.getStringExtra(EXTRA_SESSION_ID);
        final String actionToken = intent.getStringExtra(EXTRA_ACTION_TOKEN);

        cancelIncomingCallNotification(context);

        if (sessionId != null && !sessionId.isEmpty() && !ACTION_MISSED_CALL.equals(receiverAction)) {
            cancelMissedCallTimeout(context, sessionId);
        }

        if (ACTION_ACCEPT_CALL.equals(receiverAction)) {
            launchMainActivity(context, sessionId);
        }

        final PendingResult pendingResult = goAsync();
        new Thread(() -> {
            try {
                final String backendAction = toBackendAction(receiverAction);
                if (backendAction != null && sessionId != null && !sessionId.isEmpty()) {
                    CallActionApi.sendCallAction(sessionId, backendAction, actionToken);
                }
            } catch (Exception exception) {
                Log.e(TAG, "Error handling incoming call action", exception);
            } finally {
                pendingResult.finish();
            }
        }).start();
    }

    public static PendingIntent createActionPendingIntent(Context context, String action, Bundle extras) {
        Intent intent = new Intent(context, IncomingCallActionReceiver.class);
        intent.setAction(action);
        if (extras != null) {
            intent.putExtras(extras);
        }

        return PendingIntent.getBroadcast(
                context,
                buildRequestCode(extras != null ? extras.getString(EXTRA_SESSION_ID) : null, action),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | immutableFlag()
        );
    }

    public static void scheduleMissedCallTimeout(Context context, Bundle extras) {
        if (extras == null) {
            return;
        }

        String sessionId = extras.getString(EXTRA_SESSION_ID);
        if (sessionId == null || sessionId.isEmpty()) {
            return;
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        PendingIntent timeoutIntent = createActionPendingIntent(context, ACTION_MISSED_CALL, extras);
        long triggerAt = System.currentTimeMillis() + MISSED_CALL_DELAY_MS;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, timeoutIntent);
        } else {
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAt, timeoutIntent);
        }
    }

    public static void cancelMissedCallTimeout(Context context, String sessionId) {
        if (sessionId == null || sessionId.isEmpty()) {
            return;
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        Intent intent = new Intent(context, IncomingCallActionReceiver.class);
        intent.setAction(ACTION_MISSED_CALL);
        intent.putExtra(EXTRA_SESSION_ID, sessionId);

        PendingIntent timeoutIntent = PendingIntent.getBroadcast(
                context,
                buildRequestCode(sessionId, ACTION_MISSED_CALL),
                intent,
                PendingIntent.FLAG_NO_CREATE | immutableFlag()
        );

        if (timeoutIntent != null) {
            alarmManager.cancel(timeoutIntent);
            timeoutIntent.cancel();
        }
    }

    private static void launchMainActivity(Context context, String sessionId) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(buildCallDeepLink(sessionId, "accept"));
        context.startActivity(intent);
    }

    private static Uri buildCallDeepLink(String sessionId, String action) {
        Uri.Builder builder = new Uri.Builder()
                .scheme(APP_SCHEME)
                .authority(APP_HOST);

        if (sessionId != null && !sessionId.isEmpty()) {
            builder.appendQueryParameter("session", sessionId);
        }

        if (action != null && !action.isEmpty()) {
            builder.appendQueryParameter("action", action);
        }

        return builder.build();
    }

    private static String toBackendAction(String receiverAction) {
        if (ACTION_ACCEPT_CALL.equals(receiverAction)) {
            return "accept";
        }
        if (ACTION_REJECT_CALL.equals(receiverAction)) {
            return "reject";
        }
        if (ACTION_MISSED_CALL.equals(receiverAction)) {
            return "missed";
        }
        return null;
    }

    private static int buildRequestCode(String sessionId, String action) {
        String key = (sessionId == null ? "unknown" : sessionId) + ":" + action;
        return key.hashCode();
    }

    private static int immutableFlag() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0;
    }

    private static void cancelIncomingCallNotification(Context context) {
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(CALL_NOTIFICATION_ID);
        }
    }
}
