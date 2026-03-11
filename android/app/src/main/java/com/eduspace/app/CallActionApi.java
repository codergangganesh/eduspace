package com.eduspace.app;

import android.util.Log;

import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public final class CallActionApi {

    private static final String TAG = "CallActionApi";

    private CallActionApi() {
    }

    public static boolean sendCallAction(String sessionId, String action, String actionToken) {
        if (sessionId == null || sessionId.isEmpty() || action == null || action.isEmpty()) {
            return false;
        }

        if (BuildConfig.SUPABASE_URL == null || BuildConfig.SUPABASE_URL.isEmpty()) {
            Log.w(TAG, "SUPABASE_URL is missing. Skipping native call action.");
            return false;
        }

        HttpURLConnection connection = null;

        try {
            URL url = new URL(BuildConfig.SUPABASE_URL + "/functions/v1/call-action");
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");

            if (BuildConfig.SUPABASE_ANON_KEY != null && !BuildConfig.SUPABASE_ANON_KEY.isEmpty()) {
                connection.setRequestProperty("apikey", BuildConfig.SUPABASE_ANON_KEY);
                connection.setRequestProperty("Authorization", "Bearer " + BuildConfig.SUPABASE_ANON_KEY);
            }

            JSONObject body = new JSONObject();
            body.put("sessionId", sessionId);
            body.put("action", action);
            if (actionToken != null && !actionToken.isEmpty()) {
                body.put("actionToken", actionToken);
            }

            byte[] payload = body.toString().getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(payload.length);

            try (OutputStream outputStream = connection.getOutputStream()) {
                outputStream.write(payload);
            }

            int statusCode = connection.getResponseCode();
            if (statusCode >= 200 && statusCode < 300) {
                return true;
            }

            String errorBody = readResponseBody(connection);
            Log.w(TAG, "Native call action failed: HTTP " + statusCode + " " + errorBody);
        } catch (Exception exception) {
            Log.e(TAG, "Error sending native call action", exception);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }

        return false;
    }

    private static String readResponseBody(HttpURLConnection connection) {
        if (connection == null) {
            return "";
        }

        try (InputStream errorStream = connection.getErrorStream()) {
            if (errorStream == null) {
                return "";
            }

            byte[] buffer = new byte[1024];
            StringBuilder response = new StringBuilder();
            int bytesRead;

            while ((bytesRead = errorStream.read(buffer)) != -1) {
                response.append(new String(buffer, 0, bytesRead, StandardCharsets.UTF_8));
            }

            return response.toString();
        } catch (Exception ignored) {
            return "";
        }
    }
}
