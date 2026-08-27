import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English (Base)
import enCommon from '@/locales/en/common.json';
import enDashboard from '@/locales/en/dashboard.json';
import enProfile from '@/locales/en/profile.json';
import enMessages from '@/locales/en/messages.json';
import enNotifications from '@/locales/en/notifications.json';
import enQuizzes from '@/locales/en/quizzes.json';
import enAssignments from '@/locales/en/assignments.json';
import enAttendance from '@/locales/en/attendance.json';
import enAuth from '@/locales/en/auth.json';
import enLecturer from '@/locales/en/lecturer.json';
import enAdmin from '@/locales/en/admin.json';
import enSettings from '@/locales/en/settings.json';

// Import Hindi
import hiCommon from '@/locales/hi/common.json';
import hiDashboard from '@/locales/hi/dashboard.json';
import hiProfile from '@/locales/hi/profile.json';
import hiMessages from '@/locales/hi/messages.json';
import hiNotifications from '@/locales/hi/notifications.json';
import hiQuizzes from '@/locales/hi/quizzes.json';
import hiAssignments from '@/locales/hi/assignments.json';
import hiAttendance from '@/locales/hi/attendance.json';
import hiAuth from '@/locales/hi/auth.json';
import hiLecturer from '@/locales/hi/lecturer.json';
import hiAdmin from '@/locales/hi/admin.json';
import hiSettings from '@/locales/hi/settings.json';

// Import Telugu
import teCommon from '@/locales/te/common.json';
import teDashboard from '@/locales/te/dashboard.json';
import teProfile from '@/locales/te/profile.json';
import teMessages from '@/locales/te/messages.json';
import teNotifications from '@/locales/te/notifications.json';
import teQuizzes from '@/locales/te/quizzes.json';
import teAssignments from '@/locales/te/assignments.json';
import teAttendance from '@/locales/te/attendance.json';
import teAuth from '@/locales/te/auth.json';
import teLecturer from '@/locales/te/lecturer.json';
import teAdmin from '@/locales/te/admin.json';
import teSettings from '@/locales/te/settings.json';

// Import Spanish
import esCommon from '@/locales/es/common.json';
import esDashboard from '@/locales/es/dashboard.json';
import esProfile from '@/locales/es/profile.json';
import esMessages from '@/locales/es/messages.json';
import esNotifications from '@/locales/es/notifications.json';

// Import French
import frCommon from '@/locales/fr/common.json';
import frDashboard from '@/locales/fr/dashboard.json';
import frProfile from '@/locales/fr/profile.json';
import frMessages from '@/locales/fr/messages.json';
import frNotifications from '@/locales/fr/notifications.json';

// Import German
import deCommon from '@/locales/de/common.json';
import deDashboard from '@/locales/de/dashboard.json';
import deProfile from '@/locales/de/profile.json';
import deMessages from '@/locales/de/messages.json';
import deNotifications from '@/locales/de/notifications.json';

// Import Chinese
import zhCommon from '@/locales/zh/common.json';
import zhDashboard from '@/locales/zh/dashboard.json';
import zhProfile from '@/locales/zh/profile.json';
import zhMessages from '@/locales/zh/messages.json';
import zhNotifications from '@/locales/zh/notifications.json';

// Import Japanese
import jaCommon from '@/locales/ja/common.json';
import jaDashboard from '@/locales/ja/dashboard.json';
import jaProfile from '@/locales/ja/profile.json';
import jaMessages from '@/locales/ja/messages.json';
import jaNotifications from '@/locales/ja/notifications.json';

/**
 * Builds a unified bundle where namespaces can be accessed both via:
 * 1. Default namespace dot-notation: t("settings.identity"), t("dashboard.welcomeBack"), t("assignments.dueDate")
 * 2. Standard namespace colon-notation: t("settings:identity"), t("dashboard:welcomeBack")
 * 3. Flat keys inside common: t("save"), t("cancel"), t("common.save")
 */
function createBundle(raw: {
    common: any;
    dashboard: any;
    profile: any;
    messages: any;
    notifications: any;
    quizzes: any;
    assignments: any;
    attendance: any;
    auth: any;
    lecturer: any;
    admin: any;
    settings: any;
}) {
    return {
        ...raw,
        common: {
            ...raw.common,
            common: raw.common,
            dashboard: raw.dashboard,
            profile: raw.profile,
            messages: raw.messages,
            notifications: raw.notifications,
            quizzes: raw.quizzes,
            assignments: raw.assignments,
            attendance: raw.attendance,
            auth: raw.auth,
            lecturer: raw.lecturer,
            admin: raw.admin,
            settings: raw.settings,
        },
    };
}

const resources = {
    en: createBundle({
        common: enCommon,
        dashboard: enDashboard,
        profile: enProfile,
        messages: enMessages,
        notifications: enNotifications,
        quizzes: enQuizzes,
        assignments: enAssignments,
        attendance: enAttendance,
        auth: enAuth,
        lecturer: enLecturer,
        admin: enAdmin,
        settings: enSettings,
    }),
    hi: createBundle({
        common: hiCommon,
        dashboard: hiDashboard,
        profile: hiProfile,
        messages: hiMessages,
        notifications: hiNotifications,
        quizzes: hiQuizzes,
        assignments: hiAssignments,
        attendance: hiAttendance,
        auth: hiAuth,
        lecturer: hiLecturer,
        admin: hiAdmin,
        settings: hiSettings,
    }),
    te: createBundle({
        common: teCommon,
        dashboard: teDashboard,
        profile: teProfile,
        messages: teMessages,
        notifications: teNotifications,
        quizzes: teQuizzes,
        assignments: teAssignments,
        attendance: teAttendance,
        auth: teAuth,
        lecturer: teLecturer,
        admin: teAdmin,
        settings: teSettings,
    }),
    es: createBundle({
        common: esCommon,
        dashboard: esDashboard,
        profile: esProfile,
        messages: esMessages,
        notifications: esNotifications,
        quizzes: enQuizzes,
        assignments: enAssignments,
        attendance: enAttendance,
        auth: enAuth,
        lecturer: enLecturer,
        admin: enAdmin,
        settings: enSettings,
    }),
    fr: createBundle({
        common: frCommon,
        dashboard: frDashboard,
        profile: frProfile,
        messages: frMessages,
        notifications: frNotifications,
        quizzes: enQuizzes,
        assignments: enAssignments,
        attendance: enAttendance,
        auth: enAuth,
        lecturer: enLecturer,
        admin: enAdmin,
        settings: enSettings,
    }),
    de: createBundle({
        common: deCommon,
        dashboard: deDashboard,
        profile: deProfile,
        messages: deMessages,
        notifications: deNotifications,
        quizzes: enQuizzes,
        assignments: enAssignments,
        attendance: enAttendance,
        auth: enAuth,
        lecturer: enLecturer,
        admin: enAdmin,
        settings: enSettings,
    }),
    zh: createBundle({
        common: zhCommon,
        dashboard: zhDashboard,
        profile: zhProfile,
        messages: zhMessages,
        notifications: zhNotifications,
        quizzes: enQuizzes,
        assignments: enAssignments,
        attendance: enAttendance,
        auth: enAuth,
        lecturer: enLecturer,
        admin: enAdmin,
        settings: enSettings,
    }),
    ja: createBundle({
        common: jaCommon,
        dashboard: jaDashboard,
        profile: jaProfile,
        messages: jaMessages,
        notifications: jaNotifications,
        quizzes: enQuizzes,
        assignments: enAssignments,
        attendance: enAttendance,
        auth: enAuth,
        lecturer: enLecturer,
        admin: enAdmin,
        settings: enSettings,
    }),
};

const allNamespaces = [
    'common',
    'dashboard',
    'profile',
    'messages',
    'notifications',
    'quizzes',
    'assignments',
    'attendance',
    'auth',
    'lecturer',
    'admin',
    'settings',
];

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        defaultNS: 'common',
        ns: allNamespaces,
        fallbackNS: allNamespaces,
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
            bindI18n: 'languageChanged loaded',
            bindI18nStore: 'added removed',
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
