import Joi from "joi";
import { ObjectId } from "mongodb";
import { DateTime } from "luxon";

import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { CARD_CONSTANTS, NOTIFICATION_CONSTANTS } from "~/utils/constants";
import { cardModel } from "./cardModel";

// =====================================================================================================
const NOTIFICATION_COLLECTION_NAME = "notifications";
const NOTIFICATION_COLLECTION_SCHEMA = Joi.object({
  actorId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  impactResistantId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  objectId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  type: Joi.string()
    .valid(
      NOTIFICATION_CONSTANTS.TYPE.REMOVE,
      NOTIFICATION_CONSTANTS.TYPE.ADD,
      NOTIFICATION_CONSTANTS.TYPE.INVITE,
      NOTIFICATION_CONSTANTS.TYPE.DEADLINE
    )
    .required(),
  from: Joi.string()
    .valid(NOTIFICATION_CONSTANTS.FROM.BOARD, NOTIFICATION_CONSTANTS.FROM.CARD)
    .allow(null)
    .default(null),

  response: Joi.string()
    .valid(
      NOTIFICATION_CONSTANTS.RESPONSE.PENDING,
      NOTIFICATION_CONSTANTS.RESPONSE.ACCEPTED,
      NOTIFICATION_CONSTANTS.RESPONSE.REJECTED
    )
    .allow(null)
    .default(null),

  markIsRead: Joi.boolean().default(false),

  deadlineAt: Joi.date().timestamp("javascript").default(null),
  notifyBefore: Joi.number().integer().min(0).default(0),
  notifyUnit: Joi.string()
    .valid(
      CARD_CONSTANTS.NOTIFY_UNIT.DAY,
      CARD_CONSTANTS.NOTIFY_UNIT.HOUR,
      CARD_CONSTANTS.NOTIFY_UNIT.MINUTE,
      CARD_CONSTANTS.NOTIFY_UNIT.WEEK
    )
    .default(CARD_CONSTANTS.NOTIFY_UNIT.MINUTE),

  doneShownDeadlineNoti: Joi.boolean().default(false),

  happenedAt: Joi.date()
    .timestamp("javascript")
    .default(() => Date.now()),
  updatedAt: Joi.date().timestamp("javascript").default(null),
});

// =====================================================================================================
const createNotification = async (notificationData) => {
  notificationData.actorId = notificationData.actorId.toString();
  notificationData.impactResistantId =
    notificationData.impactResistantId.toString();
  notificationData.objectId = notificationData.objectId.toString();

  if (notificationData.type == NOTIFICATION_CONSTANTS.TYPE.DEADLINE) {
    let targetNoti = await findDeadlineOneByActorAndImpactResistantAndObject(
      notificationData.actorId,
      notificationData.impactResistantId,
      notificationData.objectId
    );

    if (targetNoti) {
      const result = await updateDeadlineNotification(notificationData);
      return result;
    }
  }

  if (notificationData.invitationId) {
    notificationData.invitationId = new ObjectId(notificationData.invitationId);
  }

  let formattedNotificationData = {
    ...notificationData,
    actorId: new ObjectId(notificationData.actorId),
    impactResistantId: new ObjectId(notificationData.impactResistantId),
    objectId: new ObjectId(notificationData.objectId),
    happenedAt: Date.now(),
    updatedAt: null,
  };

  try {
    const result = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .insertOne(formattedNotificationData);

    return result;
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const findOneById = async (notificationId) => {
  try {
    const result = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(notificationId) });

    return result;
  } catch (error) {
    throw error;
  }
};

const findOneByActorAndImpactResistantAndObject = async (
  actorId,
  impactResistantId,
  objectId
) => {
  actorId = actorId.toString();
  impactResistantId = impactResistantId.toString();
  objectId = objectId.toString();

  try {
    const result = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .findOne({
        actorId: new ObjectId(actorId),
        impactResistantId: new ObjectId(impactResistantId),
        objectId: new ObjectId(objectId),
      });

    return result;
  } catch (error) {
    throw error;
  }
};

const findDeadlineOneByActorAndImpactResistantAndObject = async (
  actorId,
  impactResistantId,
  objectId
) => {
  actorId = actorId.toString();
  impactResistantId = impactResistantId.toString();
  objectId = objectId.toString();

  try {
    const result = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .findOne({
        actorId: new ObjectId(actorId),
        impactResistantId: new ObjectId(impactResistantId),
        objectId: new ObjectId(objectId),
        type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
      });

    return result;
  } catch (error) {
    throw error;
  }
};

const findOneByActorAndImpactResistantAndObjectBasedOnTypeOfNotiAndTypeOfObject =
  async (actorId, impactResistantId, objectId, typeOfNoti, typeOfObject) => {
    actorId = actorId.toString();
    impactResistantId = impactResistantId.toString();
    objectId = objectId.toString();

    try {
      const result = await GET_DB()
        .collection(NOTIFICATION_COLLECTION_NAME)
        .findOne({
          actorId: new ObjectId(actorId),
          impactResistantId: new ObjectId(impactResistantId),
          objectId: new ObjectId(objectId),
          type: typeOfNoti,
          from: typeOfObject,
        });

      return result;
    } catch (error) {
      throw error;
    }
  };

// =====================================================================================================
const markAllAsRead = async (userId) => {
  try {
    const result = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .updateMany(
        {
          $or: [
            {
              actorId: new ObjectId(userId),
              type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
            },
            { impactResistantId: new ObjectId(userId) },
          ],
        },
        { $set: { markIsRead: true, updatedAt: Date.now() } }
      );

    return result;
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
const markAsReadSingleNoti = async (notification) => {
  try {
    const result = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: new ObjectId(notification._id),
        },
        {
          $set: { markIsRead: notification.markIsRead, updatedAt: Date.now() },
        },
        { returnOriginal: false }
      );

    return result;
  } catch (error) {
    throw error;
  }
};

// =====================================================================================================
// response
const updateResponseInvitation = async (noti, status) => {
  const resutl = await GET_DB()
    .collection(NOTIFICATION_COLLECTION_NAME)
    .findOneAndUpdate(
      {
        actorId: new ObjectId(noti.actorId),
        impactResistantId: new ObjectId(noti.impactResistantId),
        objectId: new ObjectId(noti.objectId),
        type: noti.type,
        response: noti.response,
      },
      {
        $set: { response: status, updatedAt: Date.now() },
      },
      { returnOriginal: false }
    );

  return resutl;
};

// Function to check if deadlineAt is in the past
function isDeadlineInPast(deadlineAt) {
  // Parse the deadlineAt string into a Luxon DateTime object
  const deadlineDate = DateTime.fromISO(deadlineAt.replace(" ", "T"));

  // Get the current time in the same format
  const now = DateTime.now();

  // Check if the deadlineDate is in the past compared to now
  return deadlineDate < now;
}

function calculateNotificationTime(deadlineAt, notifyBefore, notifyUnit) {
  // Parse the deadlineAt into a DateTime object
  const deadline = DateTime.fromFormat(deadlineAt, "yyyy-MM-dd HH:mm");

  // Subtract the notifyBefore duration from the deadline
  const notificationTime = deadline.minus({ [notifyUnit]: notifyBefore });

  // Format the notification time into 'YYYY-MM-DD HH:mm'
  return notificationTime.toFormat("yyyy-MM-dd HH:mm");
}

// full details about deadline
const updateDeadlineNotification = async (updateDeadlineData) => {
  //
  updateDeadlineData.actorId = updateDeadlineData.actorId.toString();
  updateDeadlineData.impactResistantId =
    updateDeadlineData.impactResistantId.toString();
  updateDeadlineData.objectId = updateDeadlineData.objectId.toString();

  //
  const targetCard = await cardModel.findOneById(updateDeadlineData.objectId);

  //
  const newNotifyMessage = `You have a deadline task in card ${targetCard.title.toUpperCase()} in ${
    updateDeadlineData.deadlineAt
  }`;

  const targetNoti = await findDeadlineOneByActorAndImpactResistantAndObject(
    updateDeadlineData.actorId,
    updateDeadlineData.impactResistantId,
    updateDeadlineData.objectId
  );

  if (!targetNoti) {
    await createNotification({
      ...updateDeadlineData,
      type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
    });
    return;
  }

  // check deadlineAt and the time to notify based on notifyBefore & notifyUnit & deadlineAt
  if (!isDeadlineInPast(updateDeadlineData.deadlineAt)) {
    if (
      isDeadlineInPast(
        calculateNotificationTime(
          updateDeadlineData.deadlineAt,
          updateDeadlineData.notifyBefore,
          updateDeadlineData.notifyUnit
        )
      )
    ) {
      updateDeadlineData = {
        ...updateDeadlineData,
        doneShownDeadlineNoti: true,
        markIsRead: true,
      };
    } else {
      updateDeadlineData = {
        ...updateDeadlineData,
        doneShownDeadlineNoti: false,
        markIsRead: false,
      };
    }
  } else {
    updateDeadlineData = {
      ...updateDeadlineData,
      doneShownDeadlineNoti: true,
      markIsRead: true,
    };
  }

  const result = await GET_DB()
    .collection(NOTIFICATION_COLLECTION_NAME)
    .findOneAndUpdate(
      {
        actorId: new ObjectId(updateDeadlineData.actorId),
        impactResistantId: new ObjectId(updateDeadlineData.impactResistantId),
        objectId: new ObjectId(updateDeadlineData.objectId),
        type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
      },
      {
        $set: {
          deadlineAt: updateDeadlineData.deadlineAt,
          notifyBefore: updateDeadlineData.notifyBefore,
          notifyUnit: updateDeadlineData.notifyUnit,
          notifyMessage: newNotifyMessage,
          doneShownDeadlineNoti: updateDeadlineData.doneShownDeadlineNoti,
          markIsRead: updateDeadlineData.markIsRead,
          updatedAt: Date.now(),
        },
      },
      {
        returnDocument: "after", // Return the updated document (use 'returnOriginal' for old MongoDB versions)
      }
    );

  return result;
};

// Convert a Date object to the "YYYY-MM-DD HH:mm" format
const formatDateString = (date) => {
  return DateTime.fromJSDate(date).toFormat("yyyy-MM-dd HH:mm");
};

// updateOverdueDeadlineNotification
const updateOverdueDeadlineNotification = async (userId) => {
  // Get the current date and time in Asia/Bangkok timezone
  const now = DateTime.now().setZone("Asia/Bangkok").toJSDate();
  const nowFormatted = formatDateString(now);

  // const result =
  await GET_DB()
    .collection(NOTIFICATION_COLLECTION_NAME)
    .updateMany(
      {
        actorId: new ObjectId(userId),
        impactResistantId: new ObjectId(userId),
        type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
        deadlineAt: { $lt: nowFormatted },
      },
      {
        $set: {
          doneShownDeadlineNoti: true,
        },
      }
    );

  // console.log(`${result.matchedCount} document(s) matched the query.`);
  // console.log(`${result.modifiedCount} document(s) were updated.`);
};

// doneShownDeadlineNoti of deadline
const updateIsShowDeadlineNotification = async (notificationId) => {
  notificationId = notificationId.toString();

  const result = await GET_DB()
    .collection(NOTIFICATION_COLLECTION_NAME)
    .findOneAndUpdate(
      {
        _id: new ObjectId(notificationId), // Filter by notificationId
      },
      {
        $set: {
          doneShownDeadlineNoti: true, // Update the field to true
          happenedAt: Date.now(),
        },
      },
      {
        returnDocument: "after", // Return the updated document (use 'returnOriginal' for old MongoDB versions)
      }
    );

  return result;
};

// =====================================================================================================
const getNotifications = async (userId) => {
  userId = userId.toString();

  const listNotifications = await GET_DB()
    .collection(NOTIFICATION_COLLECTION_NAME)
    .find({
      $or: [
        {
          actorId: new ObjectId(userId),
          impactResistantId: new ObjectId(userId),
          type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
          doneShownDeadlineNoti: true,
        },
        {
          impactResistantId: new ObjectId(userId),
          type: { $ne: NOTIFICATION_CONSTANTS.TYPE.DEADLINE },
        },
      ],
    })
    .sort({ happenedAt: -1 })
    .toArray();

  return listNotifications;
};

// =====================================================================================================
const getDeadlineNotifications = async (userId) => {
  const notifications = await GET_DB()
    .collection(NOTIFICATION_COLLECTION_NAME)
    .find({
      actorId: new ObjectId(userId),
      impactResistantId: new ObjectId(userId),
      type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
      doneShownDeadlineNoti: false,
    })
    .sort({ happenedAt: -1 })
    .toArray();

  return notifications;
};

// =====================================================================================================
const findCardsWithDeadlines = async (userId) => {
  const currentDateTime = new Date();

  // Helper function to parse your custom date format
  const parseCustomDate = (deadlineAt) => {
    return new Date(deadlineAt.replace(" ", "T"));
  };

  // Step 1: Fetch all relevant cards from MongoDB
  const userCards = await GET_DB()
    .collection(cardModel.CARD_COLLECTION_NAME)
    .find({
      members: {
        $elemMatch: { userId: new ObjectId(userId) },
      },
      deadlineAt: { $exists: true, $ne: "" },
    })
    .toArray();

  // Step 2: Filter cards based on the parsed deadlineAt
  const futureDeadlineCards = userCards.filter((card) => {
    const deadlineDate = parseCustomDate(card.deadlineAt);
    return deadlineDate >= currentDateTime; // Only keep cards with future deadlines
  });

  return futureDeadlineCards;
};

// =====================================================================================================
const deleteNotifications = async (notificationData) => {
  try {
    notificationData.actorId = new ObjectId(notificationData.actorId);
    notificationData.impactResistantId = new ObjectId(
      notificationData.impactResistantId
    );
    notificationData.objectId = new ObjectId(notificationData.objectId);

    await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .deleteMany({
        actorId: new ObjectId(notificationData.actorId),
        impactResistantId: new ObjectId(notificationData.impactResistantId),
        objectId: new ObjectId(notificationData.objectId),
        type: notificationData.type,
      });
  } catch (err) {
    throw err;
  }
};

// =====================================================================================================
const deleteDeadlineNotiForSingleAssignee = async (notificationData) => {
  try {
    notificationData.actorId = new ObjectId(notificationData.actorId);
    notificationData.impactResistantId = new ObjectId(
      notificationData.impactResistantId
    );
    notificationData.objectId = new ObjectId(notificationData.objectId);

    await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .deleteOne({
        actorId: new ObjectId(notificationData.actorId),
        impactResistantId: new ObjectId(notificationData.impactResistantId),
        objectId: new ObjectId(notificationData.objectId),
        type: notificationData.type,
      });
  } catch (err) {
    throw err;
  }
};

// =====================================================================================================
const deleteSingleNoti = async (notificationId) => {
  try {
    notificationId = new ObjectId(notificationId);

    await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .deleteOne({
        _id: new ObjectId(notificationId),
      });
  } catch (err) {
    throw err;
  }
};

// =====================================================================================================
const deleteAllNotifications = async (userId) => {
  userId = userId.toString();

  try {
    const listNotifications = await GET_DB()
      .collection(NOTIFICATION_COLLECTION_NAME)
      .deleteMany({
        $or: [
          {
            actorId: new ObjectId(userId),
            impactResistantId: new ObjectId(userId),
            type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
            doneShownDeadlineNoti: true,
          },
          {
            impactResistantId: new ObjectId(userId),
            type: { $ne: NOTIFICATION_CONSTANTS.TYPE.DEADLINE },
          },
        ],
      });

    return listNotifications;
  } catch (err) {
    throw err;
  }
};

// =====================================================================================================
// =====================================================================================================
export const notificationModel = {
  NOTIFICATION_COLLECTION_NAME,
  NOTIFICATION_COLLECTION_SCHEMA,
  createNotification,
  findOneById,
  findOneByActorAndImpactResistantAndObject,
  findDeadlineOneByActorAndImpactResistantAndObject,
  findOneByActorAndImpactResistantAndObjectBasedOnTypeOfNotiAndTypeOfObject,
  markAllAsRead,
  markAsReadSingleNoti,
  updateResponseInvitation,
  updateDeadlineNotification,
  updateOverdueDeadlineNotification,
  updateIsShowDeadlineNotification,
  getNotifications,
  getDeadlineNotifications,
  findCardsWithDeadlines,
  deleteNotifications,
  deleteDeadlineNotiForSingleAssignee,
  deleteSingleNoti,
  deleteAllNotifications,
};
