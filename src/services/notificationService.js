/* eslint-disable indent */
import { notificationModel } from "~/models/notificationModel";
import { NOTIFICATION_CONSTANTS } from "~/utils/constants";
import { boardService } from "./boardService";
import { userService } from "./userService";
import { cardModel } from "~/models/cardModel";

// =====================================================================================================
const createNotification = async (notificationData) => {
  notificationData.actorId = notificationData.actorId.toString();
  notificationData.impactResistantId =
    notificationData.impactResistantId.toString();
  notificationData.objectId = notificationData.objectId.toString();

  try {
    const targetActor = await userService.getUserById(notificationData.actorId);

    var notifyMessage = "";
    switch (notificationData.type) {
      case NOTIFICATION_CONSTANTS.TYPE.ADD: {
        const targetCard = await cardModel.findOneById(
          notificationData.objectId
        );
        const targetBoard = await boardService.getBoardById(
          targetCard.boardId.toString()
        );

        if (notificationData.impactResistantId !== notificationData.actorId) {
          notifyMessage = `${
            targetActor.username.charAt(0).toUpperCase() +
            targetActor.username.slice(1)
          } added you into card ${targetCard.title.toUpperCase()} of board ${targetBoard.title.toUpperCase()}`;
        } else {
          notifyMessage = `You've just added yourself into card ${targetCard.title.toUpperCase()} of board ${targetBoard.title.toUpperCase()}`;
        }

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.REMOVE: {
        if (notificationData.from === NOTIFICATION_CONSTANTS.FROM.CARD) {
          const targetCard = await cardModel.findOneById(
            notificationData.objectId
          );

          const targetBoard = await boardService.getBoardById(
            targetCard.boardId.toString()
          );

          if (notificationData.impactResistantId !== notificationData.actorId) {
            notifyMessage = `${
              targetActor.username.charAt(0).toUpperCase() +
              targetActor.username.slice(1)
            } removed you from card ${targetCard.title.toUpperCase()} of board ${targetBoard.title.toUpperCase()}`;
          } else {
            notifyMessage = `You've just removed yourself from card ${targetCard.title.toUpperCase()} of board ${targetBoard.title.toUpperCase()}`;
          }
        } else if (
          notificationData.from === NOTIFICATION_CONSTANTS.FROM.BOARD
        ) {
          const targetBoard = await boardService.getBoardById(
            notificationData.objectId
          );

          if (notificationData.actorId !== notificationData.impactResistantId) {
            notifyMessage = `${
              targetActor.username.charAt(0).toUpperCase() +
              targetActor.username.slice(1)
            } removed you from board ${targetBoard.title.toUpperCase()}`;
          } else {
            notifyMessage = `You've removed you from board ${targetBoard.title.toUpperCase()}`;
          }
        }

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.DELETE: {
        if (notificationData.actorId !== notificationData.impactResistantId) {
          if (notificationData.from === NOTIFICATION_CONSTANTS.FROM.CARD) {
            const targetCard = await cardModel.findOneById(
              notificationData.objectId
            );

            if (notificationData.notifyForCreator) {
              notifyMessage = `The card ${targetCard.title.toUpperCase()} that you are creator, has been removed by ${
                targetActor.username.charAt(0).toUpperCase() +
                targetActor.username.slice(1)
              }.`;
            } else {
              notifyMessage = `The card ${targetCard.title.toUpperCase()} that you are the participant, has been removed by ${
                targetActor.username.charAt(0).toUpperCase() +
                targetActor.username.slice(1)
              }.`;
            }
          } else if (
            notificationData.from === NOTIFICATION_CONSTANTS.FROM.BOARD
          ) {
            const targetBoard = await boardService.getBoardById(
              notificationData.objectId
            );

            if (notificationData.notifyForCreator) {
              notifyMessage = `The board ${targetBoard.title.toUpperCase()} that you are the creator, has been removed by ${
                targetActor.username.charAt(0).toUpperCase() +
                targetActor.username.slice(1)
              }.`;
            } else {
              notifyMessage = `The board ${targetBoard.title.toUpperCase()} that you are the participant, has been removed by ${
                targetActor.username.charAt(0).toUpperCase() +
                targetActor.username.slice(1)
              }.`;
            }
          }
        } else if (
          notificationData.actorId === notificationData.impactResistantId
        ) {
          if (notificationData.from === NOTIFICATION_CONSTANTS.FROM.CARD) {
            const targetCard = await cardModel.findOneById(
              notificationData.objectId
            );

            if (notificationData.notifyForCreator) {
              notifyMessage = `You've just removed the card ${targetCard.title.toUpperCase()} that you are the creator.`;
            } else {
              notifyMessage = `You've just removed the card ${targetCard.title.toUpperCase()} that you are the participant.`;
            }
          } else if (
            notificationData.from === NOTIFICATION_CONSTANTS.FROM.BOARD
          ) {
            const targetBoard = await boardService.getBoardById(
              notificationData.objectId
            );

            if (notificationData.notifyForCreator) {
              notifyMessage = `You've just removed the board ${targetBoard.title.toUpperCase()} that you are the creator.`;
            } else {
              notifyMessage = `You've just removed the board ${targetBoard.title.toUpperCase()} that you are the participant.`;
            }
          }
        }

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.INVITE: {
        const targetBoard = await boardService.getBoardById(
          notificationData.objectId
        );

        notifyMessage = `${
          targetActor.username.charAt(0).toUpperCase() +
          targetActor.username.slice(1)
        } invited you to join into board ${targetBoard.title.toUpperCase()}`;

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.RESPONSE_INVITATION: {
        const targetBoard = await boardService.getBoardById(
          notificationData.objectId
        );

        if (notificationData.via) {
          notifyMessage = `${
            targetActor.username.charAt(0).toUpperCase() +
            targetActor.username.slice(1)
          } has joined into your board ${targetBoard.title.toUpperCase()} via your invitation link`;
        } else if (notificationData.response) {
          notifyMessage = `${
            targetActor.username.charAt(0).toUpperCase() +
            targetActor.username.slice(1)
          } ${notificationData.response.toLowerCase()} your invitation to join into board ${targetBoard.title.toUpperCase()}`;
        }

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.CHANGE_ROLE: {
        const targetBoard = await boardService.getBoardById(
          notificationData.objectId
        );

        if (notificationData.actorId !== notificationData.impactResistantId) {
          notifyMessage = `${
            targetActor.username.charAt(0).toUpperCase() +
            targetActor.username.slice(1)
          } changed your role in board ${targetBoard.title.toUpperCase()} to be ${
            notificationData.role.charAt(0).toUpperCase() +
            notificationData.role.slice(1)
          }`;
        } else {
          notifyMessage = `You've changed your role in board ${targetBoard.title.toUpperCase()} to be ${
            notificationData.role.charAt(0).toUpperCase() +
            notificationData.role.slice(1)
          }`;
        }

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.DEADLINE: {
        const targetCard = await cardModel.findOneById(
          notificationData.objectId
        );

        notifyMessage = `You have a deadline task in card ${targetCard.title.toUpperCase()} in ${
          notificationData.deadlineAt
        }`;

        notificationData = {
          ...notificationData,
          deadlineAt: notificationData.deadlineAt,
          notifyBefore: notificationData.notifyBefore,
          notifyUnit: notificationData.notifyUnit,
          doneShownDeadlineNoti: false,
        };

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.COMMENT: {
        const targetCard = await cardModel.findOneById(
          notificationData.objectId
        );

        notifyMessage = `${
          targetActor.username.charAt(0).toUpperCase() +
          targetActor.username.slice(1)
        } has commented in the card ${targetCard.title.toUpperCase()} of board ${targetCard.title.toUpperCase()}`;

        break;
      }

      case NOTIFICATION_CONSTANTS.TYPE.REPLY: {
        const targetCard = await cardModel.findOneById(
          notificationData.objectId
        );

        notifyMessage = `${
          targetActor.username.charAt(0).toUpperCase() +
          targetActor.username.slice(1)
        } has replied to the original comment of card ${targetCard.title.toUpperCase()} of board ${targetCard.title.toUpperCase()} that you've replied.`;

        break;
      }

      default: {
        notifyMessage = ``;
        break;
      }
    }

    notificationData = {
      ...notificationData,
      actorName: targetActor.username,
      notifyMessage: notifyMessage,
      markIsRead: false,
    };

    const newNotification = await notificationModel.createNotification(
      notificationData
    );

    // lấy bản ghi board sau khi gọi
    let getNewNotification = null;

    if (newNotification.insertedId) {
      getNewNotification = await notificationModel.findOneById(
        newNotification.insertedId.toString()
      );
    } else {
      getNewNotification =
        await notificationModel.findDeadlineOneByActorAndImpactResistantAndObject(
          notificationData.actorId,
          notificationData.impactResistantId,
          notificationData.objectId
        );
    }

    return getNewNotification;
  } catch (error) {
    throw error;
  }
};

// const createDeadlineNotification = async (notificationData) => {
//   try {
//     const targetCard = await cardModel.findOneById(notificationData.objectId);

//     var notifyMessage = "";
//     notifyMessage = `You have a deadline task in card ${targetCard.title.toUpperCase()} in ${
//       notificationData.deadlineAt
//     }`;

//     notificationData = {
//       ...notificationData,
//       notifyMessage: notifyMessage,
//       type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
//       deadlineAt: notificationData.deadlineAt,
//       notifyBefore: notificationData.notifyBefore,
//       notifyUnit: notificationData.notifyUnit,
//       markIsRead: false,
//     };

//     const existingNotification =
//       await notificationModel.findOneByActorAndImpactResistantAndObject(
//         notificationData.actorId,
//         notificationData.impactResistantId,
//         notificationData.objectId
//       );

//     // If no duplicate is found, create a new notification
//     if (existingNotification) {
//       return;
//     } else {
//       const newNotification = await notificationModel.createNotification(
//         notificationData
//       );

//       // lấy bản ghi board sau khi gọi
//       const getNewNotification = await notificationModel.findOneById(
//         newNotification.insertedId.toString()
//       );

//       return getNewNotification;
//     }
//   } catch (error) {
//     throw error;
//   }
// };

// =====================================================================================================
const markAllAsRead = async (userId) => {
  try {
    await notificationModel.markAllAsRead(userId);

    return {
      markAllAsReadResult: "Successfully marked all notifications as read!",
    };
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const markAsReadSingleNoti = async (notification) => {
  try {
    await notificationModel.markAsReadSingleNoti(notification);

    const markAsReadNotification = await notificationModel.findOneById(
      notification._id
    );

    return markAsReadNotification;
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const getNotifications = async (userId) => {
  try {
    const listNotifications = await notificationModel.getNotifications(userId);

    return listNotifications;
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const removeDuplicateNotifications = (notifications) => {
  const uniqueNotifications = [];
  const seen = new Set();

  notifications.forEach((notification) => {
    const uniqueKey = `${notification.actorId}-${notification.impactResistantId}-${notification.objectId}`;

    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      uniqueNotifications.push(notification);
    }
  });

  return uniqueNotifications;
};

const createListDeadlineNotifications = async (userId) => {
  const futureDeadlineCards = await notificationModel.findCardsWithDeadlines(
    userId
  );

  const notifications = futureDeadlineCards.map((card) => {
    return {
      actorId: userId,
      impactResistantId: userId,
      objectId: card._id,
      type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
      deadlineAt: card.deadlineAt,
      notifyBefore: card.notifyBefore,
      notifyUnit: card.notifyUnit,
    };
  });

  removeDuplicateNotifications(notifications);

  notifications.map((notification) => createNotification(notification));
};

// =====================================================================================================
const deleteDeadlineNotifications = async (cardId, members) => {
  if (!cardId || !members || !Array.isArray(members)) {
    throw new Error("Invalid arguments provided.");
  }

  // Collect all the member userIds
  const memberUserIds = members.map((member) => member.userId);

  // Validate memberUserIds
  if (memberUserIds.length === 0) {
    // console.warn("No members found for this card.");
    return;
  }

  // Prepare the deletion promises for each member
  const deletionPromises = memberUserIds.map((userId) =>
    notificationModel.deleteNotifications({
      actorId: userId,
      impactResistantId: userId,
      objectId: cardId,
      type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
    })
  );

  try {
    // Execute all deletion promises concurrently and wait for all to complete
    await Promise.all(deletionPromises);

    // console.log("All deadline notifications for the card have been deleted.");
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const deleteNotificationForMembers = async (
  userId,
  objectId,
  members,
  typeOfObject
) => {
  if (!objectId || !members || !Array.isArray(members)) {
    throw new Error("Invalid arguments provided.");
  }

  // Collect all the member userIds
  const memberUserIds = members.map((member) => member.userId);

  // Validate memberUserIds
  if (memberUserIds.length === 0) {
    // console.warn("No members found for this card.");
    return;
  }

  // Prepare the deletion promises for each member
  const creationPromises = memberUserIds.map((memberId) =>
    notificationService.createNotification({
      actorId: userId,
      impactResistantId: memberId,
      objectId: objectId,
      type: NOTIFICATION_CONSTANTS.TYPE.DELETE,
      from: typeOfObject,
    })
  );

  try {
    // Execute all deletion promises concurrently and wait for all to complete
    await Promise.all(creationPromises);

    // console.log("All deadline notifications for the card have been deleted.");
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const deleteNotificationForCreator = async (
  actorId,
  creatorId,
  cardId,
  typeOfDeletingObject
) => {
  try {
    const responseDeleteCardNotificationForCreator =
      await notificationService.createNotification({
        actorId: actorId,
        impactResistantId: creatorId,
        objectId: cardId,
        type: NOTIFICATION_CONSTANTS.TYPE.DELETE,
        from: typeOfDeletingObject,
        notifyForCreator: true,
      });

    return responseDeleteCardNotificationForCreator;
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const deleteSingleNoti = async (notificationId) => {
  try {
    // Execute all deletion promises concurrently and wait for all to complete
    await notificationModel.deleteSingleNoti(notificationId);

    return { removeNotiResult: "Successfully removed notification." };
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const deleteAllNotifications = async (userId) => {
  try {
    // Execute all deletion promises concurrently and wait for all to complete
    await notificationModel.deleteAllNotifications(userId);

    return { removeAllNotisResult: "Successfully removed all notifications." };
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
// =====================================================================================================
export const notificationService = {
  createNotification,
  markAllAsRead,
  markAsReadSingleNoti,
  getNotifications,
  createListDeadlineNotifications,
  deleteDeadlineNotifications,
  deleteNotificationForMembers,
  deleteNotificationForCreator,
  deleteSingleNoti,
  deleteAllNotifications,
};
