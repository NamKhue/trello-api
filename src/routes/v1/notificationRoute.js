import express from "express";

// import { authenticateJWT } from "~/middlewares/authenticateJWT";
// import {
//   authorizeRoleBoardForBoardUser,
// } from "~/middlewares/authorizeRole";

// import { ROLE_TYPES } from "~/utils/constants";

import { notificationController } from "~/controllers/notificationController";
import { authenticateJWT } from "~/middlewares/authenticateJWT";

const Router = express.Router();

// Create a new notification
Router.post("/", notificationController.createNotification);

// Get notifications
Router.get(
  "/list-notifications",
  authenticateJWT,
  notificationController.getNotifications
);

Router.post(
  "/mark-all-as-read",
  // authenticateJWT,
  notificationController.markAllAsRead
);

Router.post(
  "/mark-as-read",
  // authenticateJWT,
  notificationController.markAsReadSingleNoti
);

Router.delete(
  "/remove-notification/:id",
  authenticateJWT,
  notificationController.removeNotification
);

Router.delete(
  "/remove-all-notifications",
  authenticateJWT,
  notificationController.removeAllNotifications
);

export const notificationRoute = Router;
