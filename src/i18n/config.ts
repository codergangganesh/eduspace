import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import enDashboard from '@/locales/en/dashboard.json';
import enProfile from '@/locales/en/profile.json';
import enMessages from '@/locales/en/messages.json';
import enNotifications from '@/locales/en/notifications.json';

import esCommon from '@/locales/es/common.json';
import esDashboard from '@/locales/es/dashboard.json';
import esProfile from '@/locales/es/profile.json';
import esMessages from '@/locales/es/messages.json';
import esNotifications from '@/locales/es/notifications.json';

import frCommon from '@/locales/fr/common.json';
import frDashboard from '@/locales/fr/dashboard.json';
import frProfile from '@/locales/fr/profile.json';
import frMessages from '@/locales/fr/messages.json';
import frNotifications from '@/locales/fr/notifications.json';

import deCommon from '@/locales/de/common.json';
import deDashboard from '@/locales/de/dashboard.json';
import deProfile from '@/locales/de/profile.json';
import deMessages from '@/locales/de/messages.json';
import deNotifications from '@/locales/de/notifications.json';

import zhCommon from '@/locales/zh/common.json';
import zhDashboard from '@/locales/zh/dashboard.json';
import zhProfile from '@/locales/zh/profile.json';
import zhMessages from '@/locales/zh/messages.json';
import zhNotifications from '@/locales/zh/notifications.json';

import jaCommon from '@/locales/ja/common.json';
import jaDashboard from '@/locales/ja/dashboard.json';
import jaProfile from '@/locales/ja/profile.json';
import jaMessages from '@/locales/ja/messages.json';
import jaNotifications from '@/locales/ja/notifications.json';

const resources = {
    en: {
        common: enCommon,
        dashboard: enDashboard,
        profile: enProfile,
        messages: enMessages,
        notifications: enNotifications,
    },
    es: {
        common: esCommon,
        dashboard: esDashboard,
        profile: esProfile,
        messages: esMessages,
        notifications: esNotifications,
    },
    fr: {
        common: frCommon,
        dashboard: frDashboard,
        profile: frProfile,
        messages: frMessages,
        notifications: frNotifications,
    },
    de: {
        common: deCommon,
        dashboard: deDashboard,
        profile: deProfile,
        messages: deMessages,
        notifications: deNotifications,
    },
    zh: {
        common: zhCommon,
        dashboard: zhDashboard,
        profile: zhProfile,
        messages: zhMessages,
        notifications: zhNotifications,
    },
    ja: {
        common: jaCommon,
        dashboard: jaDashboard,
        profile: jaProfile,
        messages: jaMessages,
        notifications: jaNotifications,
    },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
