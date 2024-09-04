import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";

// ================================================================================================================
// Define Collection (name & schema)
const COMMENT_COLLECTION_NAME = "comments";
const COMMENT_COLLECTION_SCHEMA = Joi.object({
  cardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  author: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  parentComment: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .allow(null),
  content: Joi.string().min(1).trim().required(),
  mentions: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
});

// ================================================================================================================
const getComments = async (cardId) => {
  cardId = cardId.toString();

  try {
    const nestedComments = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .aggregate([
        {
          $match: { cardId: new ObjectId(cardId), parentComment: null },
        },
        {
          $graphLookup: {
            from: COMMENT_COLLECTION_NAME,
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "parentComment",
            as: "replies",
            depthField: "level",
            restrictSearchWithMatch: { cardId: new ObjectId(cardId) },
          },
        },
        {
          $addFields: {
            replies: {
              $sortArray: {
                input: "$replies",
                sortBy: { createdAt: 1 },
              },
            },
          },
        },
        {
          $sort: { createdAt: 1 },
        },
      ])
      .toArray();

    return nestedComments;
  } catch (error) {
    throw new Error(error);
  }
};

// ============================================================================
const getCommentsViaParentCommentId = async (cardId, parentComment) => {
  cardId = cardId.toString();
  parentComment = parentComment.toString();

  try {
    const comments = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .find({
        cardId: new ObjectId(cardId),
        parentComment: new ObjectId(parentComment),
      })
      .project({ author: 1 })
      .toArray();

    // Extract authors and ensure uniqueness
    const authors = comments.map((comment) => comment.author.toString());
    const uniqueAuthors = [...new Set(authors)];

    return uniqueAuthors;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const createComment = async (cardId, commentData) => {
  cardId = cardId.toString();
  commentData.author = commentData.author.toString();
  commentData.parentComment =
    commentData.parentComment != null && commentData.parentComment.toString();

  if (commentData.mentions.length > 0) {
    commentData.mentions = commentData.mentions.map(
      (mentionedUserId) => new ObjectId(mentionedUserId)
    );
  }

  try {
    const newCommentData = {
      cardId: new ObjectId(cardId),
      author: new ObjectId(commentData.author),
      parentComment: commentData.parentComment
        ? new ObjectId(commentData.parentComment)
        : null,
      content: commentData.content,
      mentions: commentData.mentions.length > 0 ? commentData.mentions : [],
      createdAt: Date.now(),
    };

    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .insertOne(newCommentData);

    return result;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const findOneById = async (commentId) => {
  commentId = commentId.toString();

  try {
    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .findOne({ _id: new ObjectId(commentId) });

    return result;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
const deleteManyFromCardIds = async (cardIds) => {
  cardIds = cardIds.map((cardId) => {
    cardId = cardId.toString();
    return new ObjectId(cardId);
  });

  try {
    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .deleteMany({ cardId: { $in: cardIds } });

    return result;
  } catch (error) {
    throw error;
  }
};

const deleteManyByCardId = async (cardId) => {
  cardId = cardId.toString();

  try {
    const result = await GET_DB()
      .collection(COMMENT_COLLECTION_NAME)
      .deleteMany({ cardId: new ObjectId(cardId) });

    return result;
  } catch (error) {
    throw error;
  }
};

// ================================================================================================================
export const commentModel = {
  COMMENT_COLLECTION_NAME,
  COMMENT_COLLECTION_SCHEMA,
  getComments,
  getCommentsViaParentCommentId,
  createComment,
  findOneById,
  deleteManyFromCardIds,
  deleteManyByCardId,
};
