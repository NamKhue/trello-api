import { notificationService } from "~/services/notificationService";

// =====================================================================================================
const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(req.body);

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
const markAllAsRead = async (req, res, next) => {
  try {
    const resMarkAllAsRead = await notificationService.markAllAsRead(
      req.query.userId
    );

    res.status(200).json(resMarkAllAsRead);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
const markAsReadSingleNoti = async (req, res, next) => {
  try {
    const markAsReadNotification =
      await notificationService.markAsReadSingleNoti(req.body);

    res.status(200).json(markAsReadNotification);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(
      req.user.userId
    );

    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
const removeNotification = async (req, res, next) => {
  try {
    const notiId = req.params.id;

    const responseRemoveNoti = await notificationService.deleteSingleNoti(
      notiId
    );

    res.status(200).json(responseRemoveNoti);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
const removeAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const responseRemoveAllNotis =
      await notificationService.deleteAllNotifications(userId);

    res.status(200).json(responseRemoveAllNotis);
  } catch (error) {
    next(error);
  }
};

// =====================================================================================================
export const notificationController = {
  createNotification,
  markAllAsRead,
  markAsReadSingleNoti,
  getNotifications,
  removeNotification,
  removeAllNotifications,
};
