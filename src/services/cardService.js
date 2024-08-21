import { StatusCodes } from "http-status-codes";
import ApiError from "~/utils/ApiError";
// import { cloneDeep } from 'lodash'

// import { slugify } from '~/utils/formatters'
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";
import { notificationService } from "./notificationService";
import { NOTIFICATION_CONSTANTS } from "~/utils/constants";
import { notificationModel } from "~/models/notificationModel";
import { boardModel } from "~/models/boardModel";

// =============================================================================================================================
const createNew = async (creatorId, reqBody) => {
  try {
    const newCard = {
      ...reqBody,
      creatorId: creatorId,
    };

    const createdCard = await cardModel.createNew(newCard);
    const getNewCard = await cardModel.findOneById(
      createdCard.insertedId.toString()
    );

    if (getNewCard) {
      // xử lý cấu trúc data trước khi trả data về
      // getNewCard.cards = []

      // cập nhật mảng cardOrderIds trong collection boards
      await columnModel.pushCardOrderIds(getNewCard);
    }

    return getNewCard;
  } catch (error) {
    throw error;
  }
};

// =============================================================================================================================
const addUserIntoCard = async (actorId, cardId, assignee) => {
  try {
    await cardModel.addUserIntoCard(cardId, {
      ...assignee,
      joinedAt: Date.now(),
    });

    // save the notification that the user is added into card
    const newNoti = await notificationService.createNotification({
      actorId: actorId,
      impactResistantId: assignee.userId,
      objectId: cardId,
      type: NOTIFICATION_CONSTANTS.TYPE.ADD,
    });

    // card
    const targetCard = await cardModel.findOneById(cardId);

    // create noti if the card has deadline
    if (targetCard.deadlineAt !== "") {
      // create new deadline noti
      await notificationService.createNotification({
        actorId: assignee.userId,
        impactResistantId: assignee.userId,
        objectId: cardId,
        type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
        deadlineAt: targetCard.deadlineAt,
        notifyBefore: targetCard.notifyBefore,
        notifyUnit: targetCard.notifyUnit,
      });
    }

    return { addUserResult: "Successfully added member into card", newNoti };
  } catch (error) {
    throw error;
  }
};

// =============================================================================================================================
const removeUserFromCard = async (actorId, cardId, assignee) => {
  try {
    await cardModel.removeUserFromCard(cardId, assignee);

    // send the notification to that user
    const newNoti = await notificationService.createNotification({
      actorId: actorId,
      impactResistantId: assignee.userId,
      objectId: cardId,
      type: NOTIFICATION_CONSTANTS.TYPE.REMOVE,
      from: NOTIFICATION_CONSTANTS.FROM.CARD,
    });

    // remove deadline noti for the removing assignees
    notificationModel.deleteDeadlineNotiForSingleAssignee({
      actorId: assignee.userId,
      impactResistantId: assignee.userId,
      objectId: cardId,
      type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
    });

    return {
      removeUserResult: "Successfully removed member from card",
      newNoti,
    };
  } catch (error) {
    throw error;
  }
};

// =============================================================================================================================
const updateCard = async (cardId, reqBody) => {
  try {
    const updatedCard = {
      ...reqBody,
      updatedAt: Date.now(),
    };

    // new card
    const newCard = updatedCard;

    // old card
    const oldCard = await cardModel.findOneById(cardId);

    // create noti if the card has deadline
    if (oldCard.deadlineAt === "" && newCard.deadlineAt !== "") {
      if (newCard.members.length > 0) {
        // Create new deadline notifications sequentially
        for (const member of newCard.members) {
          await notificationService.createNotification({
            actorId: member.userId,
            impactResistantId: member.userId,
            objectId: cardId,
            type: NOTIFICATION_CONSTANTS.TYPE.DEADLINE,
            deadlineAt: newCard.deadlineAt,
            notifyBefore: newCard.notifyBefore,
            notifyUnit: newCard.notifyUnit,
          });
        }
      }
    } else if (oldCard.deadlineAt !== "" && newCard.deadlineAt !== "") {
      // check the diff from children between old and new
      // if there are changes about deadline -> modify/update deadline noti
      if (
        oldCard.notifyBefore != newCard.notifyBefore ||
        oldCard.notifyUnit != newCard.notifyUnit ||
        oldCard.deadlineAt != newCard.deadlineAt
      ) {
        if (newCard.members.length > 0) {
          // create new deadline noti
          newCard.members.map(async (member) => {
            await notificationModel.updateDeadlineNotification({
              actorId: member.userId,
              impactResistantId: member.userId,
              objectId: cardId,
              deadlineAt: newCard.deadlineAt,
              notifyBefore: newCard.notifyBefore,
              notifyUnit: newCard.notifyUnit,
            });
          });
        }
      }
    }

    // update card
    await cardModel.updateCard(cardId, newCard);

    return { modifyCardResult: "Card has been modified successfully!" };
  } catch (error) {
    throw error;
  }
};

// =============================================================================================================================
const deleteCardItem = async (actorId, cardId) => {
  try {
    const targetCard = await cardModel.findOneById(cardId);
    // console.log('targetCard:', targetCard)

    if (!targetCard) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card is not found");
    }

    // delete all deadline notis of this card
    await notificationService.deleteDeadlineNotifications(
      cardId,
      targetCard.members
    );

    // send noti to all members of this card
    await notificationService.deleteCardNotificationForMembersInCard(
      actorId,
      cardId,
      targetCard.members
    );

    // fetch all deleteCardNotificationForMembersInCard
    let listResponseDeleteCardNotificationForMembersInCard = [];

    for (const member of targetCard.members) {
      const responseDeleteCardNotificationForMembersInCard =
        await notificationModel.findOneByActorAndImpactResistantAndObjectBasedOnType(
          actorId,
          member.userId,
          cardId,
          NOTIFICATION_CONSTANTS.TYPE.DELETE
        );

      listResponseDeleteCardNotificationForMembersInCard.push(
        responseDeleteCardNotificationForMembersInCard
      );
    }

    // // send noti to the creator of board contains the card
    // // const targetBoardCreator = await boardModel.findOneById(targetCard.boardId);
    // const responseDeleteCardNotificationForCreator =
    //   await notificationService.deleteCardNotificationForCreator(
    //     actorId,
    //     targetCard.creatorId,
    //     cardId
    //   );

    // xóa card
    await cardModel.deleteOneById(cardId);

    // xóa cardId trong mảng cardOrderIds của board chứa nó
    await columnModel.pullCardOrderIds(targetCard);

    return {
      deleteCardResult: "This card have been deleted successfully!",
      listResponseDeleteCardNotificationForMembersInCard,
      // responseDeleteCardNotificationForCreator,
    };
  } catch (error) {
    throw error;
  }
};

// =============================================================================================================================
export const cardService = {
  createNew,
  addUserIntoCard,
  removeUserFromCard,
  updateCard,
  deleteCardItem,
};
