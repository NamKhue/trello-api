/* eslint-disable indent */
import cron from "node-cron";
import { DateTime } from "luxon";

import { io, userSocketMap } from "~/sockets/socket.js";

import { notificationModel } from "~/models/notificationModel";

// Function to check if current time is within the notification range before the deadline
function isWithinNotificationRange(deadlineAt, notifyBefore, notifyUnit) {
  // Parse the deadlineAt string to a DateTime object
  const deadlineDateTime = DateTime.fromFormat(deadlineAt, "yyyy-MM-dd HH:mm", {
    zone: "Asia/Bangkok",
  });

  // Get current time in the same time zone
  const dateNow = DateTime.now().setZone("Asia/Bangkok");

  // Normalize both dates to the start of the minute for comparison
  const normalizedDateNow = dateNow.startOf("minute");
  const normalizedDeadlineDateTime = deadlineDateTime.startOf("minute");

  // Handle the special case where notifyBefore is 0 and notifyUnit is 'minute'
  if (notifyBefore === 0 && notifyUnit === "minute") {
    return normalizedDateNow.equals(normalizedDeadlineDateTime);
  }

  // Calculate the difference in minutes
  const diffInMinutes = deadlineDateTime.diff(dateNow, "minutes").as("minutes");

  // Determine the notification threshold based on notifyUnit
  let notifyThreshold;
  switch (notifyUnit) {
    case "minute":
      notifyThreshold = notifyBefore;
      break;
    case "hour":
      notifyThreshold = notifyBefore * 60;
      break;
    case "day":
      notifyThreshold = notifyBefore * 24 * 60;
      break;
    case "week":
      notifyThreshold = notifyBefore * 7 * 24 * 60;
      break;
    default:
      throw new Error(
        'Unsupported notifyUnit. Use "minute", "hour", "day", or "week".'
      );
  }

  // Return true if the current time is within the notification range before the deadline
  return diffInMinutes <= notifyThreshold && diffInMinutes >= 0;
}

export const startCronJobs = () => {
  // Check for upcoming deadlines based on minute
  cron.schedule("30 * * * *", async () => {
    //
    // // based on second
    // cron.schedule("*/10 * * * * *", async () => {
    //
    console.log("Checking for upcoming deadlines...\n");

    // check all the card have deadline and the user is member/assignee of that card
    const users = Object.keys(userSocketMap);

    for (const userId of users) {
      const userSocketId = userSocketMap[userId];

      const listDeadlineNotifications =
        await notificationModel.getDeadlineNotifications(userId);
      // console.log(
      //   "🚀 ~ file: cron.js:72 ~ cron.schedule ~ listDeadlineNotifications:",
      //   listDeadlineNotifications
      // );

      if (userSocketId) {
        let validListDeadlineNotifications = [];

        listDeadlineNotifications.map((noti) => {
          if (
            isWithinNotificationRange(
              noti.deadlineAt,
              noti.notifyBefore,
              noti.notifyUnit
            )
          ) {
            noti = { ...noti, happenedAt: Date.now() };

            io.to(userSocketId).emit("deadline-notifications", [
              ...validListDeadlineNotifications,
              noti,
            ]);

            notificationModel.updateIsShowDeadlineNotification(noti._id);
          }
        });

        notificationModel.updateOverdueDeadlineNotification(userId);
      }
    }

    // send deadline notification via email
    // notifications.forEach((notification) => {
    //   emailService.sendDeadlineNotification(notification);
    // });

    console.log("Done checking for upcoming deadlines...\n");
  });
};
