import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";
import { INVITATION_STATUS } from "~/utils/constants";

// ================================================================================================================
// xác định những Fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
// const INVALID_UPDATE_FIELDS = [
//   "_id",
//   "createdAt",
//   "boardId",
//   "inviterId",
//   "email",
// ];

// ================================================================================================================
// Define Collection (name & schema)
const INVITATION_COLLECTION_NAME = "invitations";
const INVITATION_COLLECTION_SCHEMA = Joi.object({
  inviterId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  recipientId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE)
    .allow(null),
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  status: Joi.string()
    .valid(
      INVITATION_STATUS.PENDING,
      INVITATION_STATUS.ACCEPTED,
      INVITATION_STATUS.REJECTED
    )
    .required()
    .allow(null),

  token: Joi.string().required(),

  isPublic: Joi.boolean().default(false).required(),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

// ================================================================================================================
const createInvitation = async (
  inviterId,
  recipientId,
  boardId,
  token,
  isPublic,
  invitationLink
) => {
  try {
    const result = await GET_DB()
      .collection(INVITATION_COLLECTION_NAME)
      .insertOne({
        inviterId: new ObjectId(inviterId),
        recipientId: !isPublic ? new ObjectId(recipientId) : null,
        boardId: new ObjectId(boardId),
        status: !isPublic ? INVITATION_STATUS.PENDING : null,
        token: token,
        isPublic: isPublic,
        invitationLink: invitationLink,
        createdAt: Date.now(),
        updatedAt: null,
      });

    return result;
  } catch (error) {
    throw new Error(error);
  }
};

// ================================================================================================================
const findInvitationViaInviterAndRecipientAndBoard = async (
  inviterId,
  recipientId,
  boardId
) => {
  const invitation = await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .findOne({
      inviterId: new ObjectId(inviterId),
      recipientId: new ObjectId(recipientId),
      boardId: new ObjectId(boardId),
    });

  return invitation;
};

// ================================================================================================================
const findInvitationViaId = async (invitationId) => {
  const invitation = await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .findOne({ _id: new ObjectId(invitationId) });

  return invitation;
};

// ================================================================================================================
const findInvitationViaToken = async (token) => {
  const invitation = await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .findOne({ token: token });

  return invitation;
};

// ================================================================================================================
// const updateStatusInvitationToAccepted = async (token) => {
//   await GET_DB()
//     .collection(INVITATION_COLLECTION_NAME)
//     .updateOne(
//       { token },
//       {
//         $set: { status: INVITATION_STATUS.ACCEPTED, updatedAt: Date.now() },
//         $unset: { token: "" },
//       }
//     );
// };

// const updateStatusInvitationToRejected = async (token) => {
//   await GET_DB()
//     .collection(INVITATION_COLLECTION_NAME)
//     .updateOne(
//       { token },
//       { $set: { status: INVITATION_STATUS.REJECTED }, $unset: { token: "" } }
//     );
// };

// ================================================================================================================
const updateStatusInvitation = async (token, status) => {
  await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .updateOne(
      { token },
      {
        $set: { status: status, updatedAt: Date.now() },
        $unset: { token: "" },
      }
    );
};

// ================================================================================================================
const deleteInvitationLinkForPublic = async (token) => {
  await GET_DB().collection(INVITATION_COLLECTION_NAME).deleteOne({ token });
};

// ================================================================================================================
const findPublicInvitationViaBoardId = async (boardId) => {
  boardId = boardId.toString();

  const result = await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .findOne({
      boardId: new ObjectId(boardId),
      isPublic: true,
    });

  return result;
};

// ================================================================================================================
const deleteAllInvitationsViaBoardId = async (boardId) => {
  boardId = boardId.toString();

  const result = await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .deleteMany({
      boardId: new ObjectId(boardId),
    });

  return result;
};

// ================================================================================================================
export const invitationModel = {
  INVITATION_COLLECTION_NAME,
  INVITATION_COLLECTION_SCHEMA,
  createInvitation,
  findInvitationViaInviterAndRecipientAndBoard,
  findInvitationViaId,
  findInvitationViaToken,
  // updateStatusInvitationToAccepted,
  // updateStatusInvitationToRejected,
  updateStatusInvitation,
  deleteInvitationLinkForPublic,
  findPublicInvitationViaBoardId,
  deleteAllInvitationsViaBoardId,
};
