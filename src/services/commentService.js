import { commentModel } from "~/models/commentModel";
import { notificationService } from "./notificationService";
import { NOTIFICATION_CONSTANTS } from "~/utils/constants";
import { cardModel } from "~/models/cardModel";

// ================================================================================================================
const getComments = async (cardId) => {
  try {
    const allComments = await commentModel.getComments(cardId);

    return allComments;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const createComment = async (cardId, commentData) => {
  try {
    // create new noti to author of parent comment and author of other replies to parent comment
    // find the card via cardId
    const targetCard = await cardModel.findOneById(cardId);

    let listNotiForAllMembersOfCard = [];
    for (const member of targetCard.members) {
      if (commentData.author != member.userId) {
        const notiForBothRepliesAndParentComment =
          await notificationService.createNotification({
            actorId: commentData.author,
            impactResistantId: member.userId,
            objectId: cardId,
            type: NOTIFICATION_CONSTANTS.TYPE.COMMENT,
            contentComment: commentData.content,
          });

        listNotiForAllMembersOfCard.push(notiForBothRepliesAndParentComment);
      }
    }

    // create new comment
    const createdComment = await commentModel.createComment(
      cardId,
      commentData
    );

    const getNewComment = await commentModel.findOneById(
      createdComment.insertedId.toString()
    );

    return {
      getNewComment,
      listNotiForAllMembersOfCard,
    };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const createReply = async (cardId, replyData) => {
  try {
    // create new noti to author of parent comment and author of other replies to parent comment

    // find all authors of both parent comment and replies comments
    const authorOfBothParentCommentAndReplies =
      await commentModel.getCommentsViaParentCommentId(
        cardId,
        replyData.parentComment
      );
    // console.log(
    //   "🚀 ~ authorOfBothParentCommentAndReplies:",
    //   authorOfBothParentCommentAndReplies
    // );

    let listNotiForBothRepliesAndParentComment = [];
    for (const userId of authorOfBothParentCommentAndReplies) {
      if (replyData.author != userId) {
        const notiForBothRepliesAndParentComment =
          await notificationService.createNotification({
            actorId: replyData.author,
            impactResistantId: userId,
            objectId: cardId,
            type: NOTIFICATION_CONSTANTS.TYPE.REPLY,
            contentComment: replyData.content,
          });

        listNotiForBothRepliesAndParentComment.push(
          notiForBothRepliesAndParentComment
        );
      }
    }

    // create new reply
    const createdReply = await commentModel.createComment(cardId, replyData);

    const getNewReply = await commentModel.findOneById(
      createdReply.insertedId.toString()
    );

    return {
      getNewReply,
      listNotiForBothRepliesAndParentComment,
    };
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
// ================================================================================================================
export const commentService = {
  getComments,
  createComment,
  createReply,
};
