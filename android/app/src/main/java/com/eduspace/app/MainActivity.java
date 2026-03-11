package com.eduspace.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static volatile boolean appVisible = false;

    @Override
    public void onStart() {
        super.onStart();
        appVisible = true;
    }

    @Override
    public void onStop() {
        appVisible = false;
        super.onStop();
    }

    public static boolean isAppVisible() {
        return appVisible;
    }
}
