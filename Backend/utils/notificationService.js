let admin = null;
const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");

let initialized = false;
function initFirebase() {
  if (initialized) return;
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || null;
  if (!svcJson) return;
  try {
    // require firebase-admin lazily so app can run without the dependency when not configured
    try {
      admin = require("firebase-admin");
    } catch (e) {
      console.warn(
        "firebase-admin not installed; skipping FCM initialization. Install firebase-admin to enable push notifications.",
      );
      admin = null;
      return;
    }

    const svc = typeof svcJson === "string" ? JSON.parse(svcJson) : svcJson;
    admin.initializeApp({ credential: admin.credential.cert(svc) });
    initialized = true;
    console.log("Firebase admin initialized");
  } catch (err) {
    console.error("Failed to init firebase admin", err);
  }
}

initFirebase();

async function registerTokenForUser(userId, token, topic) {
  try {
    await DeviceToken.findOneAndUpdate(
      { userId, token },
      { userId, token },
      { upsert: true },
    );
    if (initialized && topic && admin) {
      await admin.messaging().subscribeToTopic([token], topic);
    }
    return true;
  } catch (err) {
    console.error("registerTokenForUser error", err);
    return false;
  }
}

async function sendNotificationToClass(targetClass, payload) {
  // payload: { title, body, data, link, type }
  try {
    // persist notification
    const note = new Notification({
      title: payload.title,
      body: payload.body,
      type: payload.type,
      link: payload.link,
      targetClass,
    });
    await note.save();

    if (!initialized) return note;

    const message = {
      notification: { title: payload.title, body: payload.body },
      data: { type: payload.type || "generic", link: payload.link || "" },
      topic: targetClass,
    };
    if (admin) {
      await admin.messaging().send(message);
    } else {
      console.warn("admin not available; skipping send to FCM");
    }
    return note;
  } catch (err) {
    console.error("sendNotificationToClass error", err);
    throw err;
  }
}

async function getNotificationsForClass(targetClass) {
  return Notification.find({ targetClass })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

module.exports = {
  initFirebase,
  registerTokenForUser,
  sendNotificationToClass,
  getNotificationsForClass,
};
