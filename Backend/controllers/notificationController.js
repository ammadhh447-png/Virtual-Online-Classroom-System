const {
  registerTokenForUser,
  getNotificationsForClass,
} = require("../utils/notificationService");
const DeviceToken = require("../models/DeviceToken");
const Notification = require("../models/Notification");

// Get notifications for current user (class notifications + global/system notifications)
exports.getMyNotifications = async (req, res) => {
  try {
    const user = req.user;
    const userId = user?.id;
    const userRole = user?.role;
    const targetClass =
      user?.rollYear && user?.rollDept && user?.section
        ? `${user.rollYear}-${user.rollDept}-${user.section}`
        : null;

    // Build filter: notifications not removed by user AND targeted to user by id OR role OR class OR global (no target)
    const orClauses = [];
    if (userId) orClauses.push({ targetUsers: { $in: [userId] } });
    if (userRole) orClauses.push({ targetRole: userRole });
    if (targetClass) orClauses.push({ targetClass: targetClass });
    // include global notifications (both targetClass and targetRole null)
    orClauses.push({
      targetClass: { $in: [null, ""] },
      targetRole: { $in: [null, ""] },
    });

    const notes = await Notification.find({
      removedBy: { $ne: userId },
      $or: orClauses,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark a notification as read for current user
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id || !userId)
      return res.status(400).json({ message: "Invalid request" });

    await Notification.findByIdAndUpdate(id, { $addToSet: { readBy: userId } });
    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear notifications for current user (mark all as read)
exports.clearNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: "Invalid request" });

    // Mark notifications as removed for this user for notifications that would be visible to them
    const user = req.user;
    const userRole = user?.role;
    const targetClass =
      user?.rollYear && user?.rollDept && user?.section
        ? `${user.rollYear}-${user.rollDept}-${user.section}`
        : null;

    const orClauses = [];
    orClauses.push({ targetUsers: { $in: [userId] } });
    if (userRole) orClauses.push({ targetRole: userRole });
    if (targetClass) orClauses.push({ targetClass: targetClass });
    orClauses.push({
      targetClass: { $in: [null, ""] },
      targetRole: { $in: [null, ""] },
    });

    await Notification.updateMany(
      { $or: orClauses },
      { $addToSet: { removedBy: userId } },
    );
    res.json({ message: "Notifications cleared" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin can create a notification
exports.createNotification = async (req, res) => {
  try {
    const { title, body, type, link, targetClass, targetRole, targetUsers } =
      req.body;
    if (!title) return res.status(400).json({ message: "Title required" });
    const note = new Notification({
      title,
      body,
      type,
      link: link || "",
      targetClass: targetClass || null,
      targetRole: targetRole || null,
      targetUsers: Array.isArray(targetUsers)
        ? targetUsers
        : targetUsers
          ? [targetUsers]
          : [],
    });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.registerToken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;
    if (!token || !userId)
      return res.status(400).json({ message: "Invalid request" });

    // Build topic from user class if available
    const user = req.user;
    const topic =
      user?.rollYear && user?.rollDept && user?.section
        ? `${user.rollYear}-${user.rollDept}-${user.section}`
        : null;

    await registerTokenForUser(userId, token, topic);
    res.json({ message: "Token registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getForClass = async (req, res) => {
  try {
    const user = req.user;
    const targetClass =
      user?.rollYear && user?.rollDept && user?.section
        ? `${user.rollYear}-${user.rollDept}-${user.section}`
        : null;
    if (!targetClass) return res.json([]);
    const notes = await getNotificationsForClass(targetClass);
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
