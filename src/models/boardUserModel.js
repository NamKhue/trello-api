import Joi from "joi";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { ROLE_TYPES } from "~/utils/constants";

import { boardModel } from "./boardModel";
import { userModel } from "./userModel";

// ================================================================================================================
// xác định những Fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
// const INVALID_UPDATE_FIELDS = ["_id", "createdAt"];

// ================================================================================================================
// define collection (name & schema)
const BOARD_USER_COLLECTION_NAME = "board_users";
const BOARD_USER_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  userId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  role: Joi.string()
    .valid(ROLE_TYPES.OWNER, ROLE_TYPES.MEMBER, ROLE_TYPES.CREATOR)
    .required(),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
});

// ================================================================================================================
const getBoardsByOwnerRole = async (userId) => {
  try {
    // Find all board entries where the user is an 'owner'
    const ownerBoards = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .find({
        userId: new ObjectId(userId),
        role: ROLE_TYPES.OWNER,
      })
      .toArray();

    if (ownerBoards.length === 0) {
      return [];
    }

    // Extract boardIds from ownerBoards
    const boardIds = ownerBoards.map((boardUser) => boardUser.boardId);

    // Retrieve board details using the boardIds
    const boards = await GET_DB()
      .collection(boardModel.BOARD_COLLECTION_NAME)
      .find({
        _id: { $in: boardIds },
        _destroy: false,
      })
      .toArray();

    return boards;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getBoardsByMemberRole = async (userId) => {
  try {
    // Find all board entries where the user is an 'member'
    const memberBoards = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .find({
        userId: new ObjectId(userId),
        role: ROLE_TYPES.MEMBER,
      })
      .toArray();

    if (memberBoards.length === 0) {
      return [];
    }

    // Extract boardIds from memberBoards
    const boardIds = memberBoards.map((boardUser) => boardUser.boardId);

    // Retrieve board details using the boardIds
    const boards = await GET_DB()
      .collection(boardModel.BOARD_COLLECTION_NAME)
      .find({
        _id: { $in: boardIds },
        _destroy: false,
      })
      .toArray();

    return boards;
  } catch (error) {
    throw new Error(error.message);
  }
};

// ================================================================================================================
const findOneById = async (boardUserId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(boardUserId),
      });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const findByUserIdAndBoardId = async (boardId, userId) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .findOne({
        boardId: new ObjectId(boardId),
        userId: new ObjectId(userId),
      });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const validateBoardUserData = (data) => {
  const { error, value } = BOARD_USER_COLLECTION_SCHEMA.validate(data, {
    abortEarly: false,
  });
  if (error) {
    throw new Error(error.details.map((detail) => detail.message).join(", "));
  }

  // Convert userId to ObjectId
  value.boardId = new ObjectId(value.boardId);
  value.userId = new ObjectId(value.userId);

  return value;
};

const createBoardUser = async (boardUserData) => {
  try {
    boardUserData = {
      ...boardUserData,
      boardId: boardUserData.boardId.toString(),
      createdAt: Date.now(),
    };

    const validData = await validateBoardUserData(boardUserData);

    const result = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .insertOne(validData);

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const getBoardFromBoardUsers = async (boardId) => {
  try {
    const users = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .find({
        boardId: new ObjectId(boardId),
      })
      .toArray();
    return users;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const getUserFromBoardUsers = async (boardId) => {
  try {
    const listOfMembers = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .aggregate([
        {
          $match: { boardId: new ObjectId(boardId) },
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails",
        },
        {
          $project: {
            _id: 1, // Exclude the document ID from the results
            userId: 1,
            role: 1,
            "userDetails._id": 1,
            "userDetails.username": 1, // Replace with actual fields from your users collection
            "userDetails.email": 1, // Replace with actual fields from your users collection
          },
        },
      ])
      .toArray((err, result) => {
        if (err) {
          console.error("Error fetching users:", err);
        } else {
          console.log("Users:", result);
        }
      });

    return listOfMembers;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const updateBoardUser = async (boardId, userId, role) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .updateOne(
        {
          boardId: new ObjectId(boardId),
          userId: new ObjectId(userId),
          updatedAt: Date.now(),
        },
        {
          $set: { role: role },
        }
      );
    return result.modifiedCount > 0;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const getRoleOfBoard = async (userId, boardId) => {
  try {
    const targetBoardUser = await GET_DB()
      .collection(BOARD_USER_COLLECTION_NAME)
      .findOne({
        userId: new ObjectId(userId),
        boardId: new ObjectId(boardId),
      });

    return targetBoardUser.role;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const validateInviteUser = Joi.object({
  boardId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  userId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
});

// INVITE MEMBER
const inviteUserToBoard = async (inviterId, inviteData) => {
  console.log(``);

  // Validate inviteData
  const { error, value } = validateInviteUser.validate(inviteData, {
    abortEarly: false,
  });

  if (error) {
    throw new Error(error.details.map((detail) => detail.message).join(", "));
  }

  const { boardId, userId } = value;

  // Ensure the inviter is a member of the board
  const inviterIsMember = await GET_DB()
    .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
    .findOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(inviterId),
      role: { $in: [ROLE_TYPES.OWNER, ROLE_TYPES.CREATOR] },
    });

  if (!inviterIsMember) {
    throw new Error(
      "Only creators and owners can invite users into the board."
    );
  }

  // Check if the user is already a member of the board
  const userAlreadyMember = await GET_DB()
    .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
    .findOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(userId),
    });

  if (userAlreadyMember) {
    throw new Error("User is already a member of this board.");
  }

  // Add user to the board
  const result = await GET_DB()
    .collection(boardUserModel.BOARD_USER_COLLECTION_NAME)
    .insertOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(userId),
      role: ROLE_TYPES.MEMBER,

      createdAt: Date.now(),
      updatedAt: null,
    });

  // return result.ops[0];
  return result;
};

// ================================================================================================================
const validateRemoveUser = Joi.object({
  boardId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
  userId: Joi.string()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .required(),
});

// REMOVE MEMBER
const removeUserFromBoard = async (removerId, removeData) => {
  // Validate removeData
  const { error, value } = validateRemoveUser.validate(removeData, {
    abortEarly: false,
  });
  if (error) {
    throw new Error(error.details.map((detail) => detail.message).join(", "));
  }

  const { boardId, userId } = value;

  // Ensure the remover is an owner or creator of the board
  const removerRole = await GET_DB()
    .collection(BOARD_USER_COLLECTION_NAME)
    .findOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(removerId),
      role: { $in: [ROLE_TYPES.OWNER, ROLE_TYPES.CREATOR] },
    });

  if (!removerRole) {
    throw new Error(
      "Remover does not have permission to remove users from this board."
    );
  }

  console.log("boardId ", boardId);
  console.log("userId ", userId);

  // Ensure the user to be removed is not the creator of the board
  const userRole = await GET_DB()
    .collection(BOARD_USER_COLLECTION_NAME)
    .findOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(userId),
    });

  if (!userRole) {
    throw new Error("User is not found in the board.");
  }

  if (userRole.role === "creator") {
    throw new Error("Cannot remove the creator of the board.");
  }

  // Remove the user from the board
  const result = await GET_DB()
    .collection(BOARD_USER_COLLECTION_NAME)
    .deleteOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(userId),
    });

  if (result.deletedCount === 0) {
    throw new Error(
      "User is not found in the board or already removed before."
    );
  }

  return {
    removeUserFromBoardResult: "User is removed from this board successfully.",
  };
  // return result;
};

// ================================================================================================================
// CHANGE ROLE FOR MEMBER
const changeUserRole = async (invokerId, roleChangeData) => {
  // Validate roleChangeData
  const { error, value } = BOARD_USER_COLLECTION_SCHEMA.validate(
    roleChangeData,
    { abortEarly: false }
  );
  if (error) {
    throw new Error(error.details.map((detail) => detail.message).join(", "));
  }

  const { boardId, userId, role } = value;

  // Ensure the invoker is an owner of the board
  const invokerIsOwner = await GET_DB()
    .collection(BOARD_USER_COLLECTION_NAME)
    .findOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(invokerId),
      role: { $in: [ROLE_TYPES.OWNER, ROLE_TYPES.CREATOR] },
    });

  if (!invokerIsOwner) {
    throw new Error(
      "Invoker does not have permission to change roles on this board."
    );
  }

  // Check if the user is a member of the board
  const userRole = await GET_DB()
    .collection(BOARD_USER_COLLECTION_NAME)
    .findOne({
      boardId: new ObjectId(boardId),
      userId: new ObjectId(userId),
    });

  if (!userRole) {
    throw new Error("User is not a member of this board.");
  }

  // Ensure the user's role is not 'creator'
  if (userRole.role === ROLE_TYPES.CREATOR) {
    throw new Error("Cannot change the role of the creator.");
  }

  // Change user's role
  const result = await GET_DB()
    .collection(BOARD_USER_COLLECTION_NAME)
    .updateOne(
      { boardId: new ObjectId(boardId), userId: new ObjectId(userId) },
      { $set: { role: role } }
    );

  if (result.modifiedCount === 0) {
    throw new Error("Failed to change user role.");
  }

  return { boardId, userId, role };
};

export const boardUserModel = {
  BOARD_USER_COLLECTION_NAME,
  BOARD_USER_COLLECTION_SCHEMA,
  getBoardsByOwnerRole,
  getBoardsByMemberRole,
  findOneById,
  findByUserIdAndBoardId,
  createBoardUser,
  getBoardFromBoardUsers,
  getUserFromBoardUsers,
  updateBoardUser,
  getRoleOfBoard,
  inviteUserToBoard,
  removeUserFromBoard,
  changeUserRole,
};
