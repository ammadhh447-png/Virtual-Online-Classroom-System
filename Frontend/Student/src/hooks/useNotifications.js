import { useEffect } from "react";
import axios from "axios";

export default function useNotifications(user) {
  useEffect(() => {
    const init = async () => {
      try {
        const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG;
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!firebaseConfig || !vapidKey) return; // not configured

        // dynamic import so app still builds without firebase
        const { initializeApp } = await import("firebase/app");
        const { getMessaging, getToken, onMessage } =
          await import("firebase/messaging");

        const app = initializeApp(JSON.parse(firebaseConfig));
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey });
        if (token) {
          // register token with backend
          await axios.post(
            `${import.meta.env.VITE_API_URL || "http://localhost:7000"}/api/notifications/register-token`,
            { token },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
        }

        onMessage(messaging, (payload) => {
          // show simple browser notification
          try {
            if (Notification.permission === "granted") {
              const { title, body } = payload.notification || {};
              new Notification(title || "Notification", { body: body || "" });
            }
          } catch (e) {
            console.error(e);
          }
        });
      } catch (err) {
        // optional: firebase not configured locally
        // console.warn('Notifications not initialized', err);
      }
    };
    init();
  }, [user]);
}
