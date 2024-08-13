import Joi from "joi";
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from "~/utils/validators";
import { ObjectId } from "mongodb";

import { GET_DB } from "~/config/mongodb";
import { INVITATION_STATUS } from "~/utils/constants";

// xác định những Fields mà chúng ta không muốn cho phép cập nhật trong hàm update()
// const INVALID_UPDATE_FIELDS = [
//   "_id",
//   "createdAt",
//   "boardId",
//   "inviterId",
//   "email",
// ];

// Define Collection (name & schema)
const INVITATION_COLLECTION_NAME = "invitations";
const INVITATION_COLLECTION_SCHEMA = Joi.object({
  inviterId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  email: Joi.string().email().required(),
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
    .required(),
  token: Joi.string().required(),

  createdAt: Joi.date().timestamp("javascript").default(Date.now),
  updatedAt: Joi.date().timestamp("javascript").default(null),
  _destroy: Joi.boolean().default(false),
});

const createInvitation = async (inviterId, recipientEmail, boardId, token) => {
  try {
    const result = await GET_DB()
      .collection(INVITATION_COLLECTION_NAME)
      .insertOne({
        inviterId: new ObjectId(inviterId),
        recipientEmail: recipientEmail,
        boardId: new ObjectId(boardId),
        status: INVITATION_STATUS.PENDING,
        token: token,
        createdAt: Date.now(),
        updateAt: null,
      });

    return result.modifiedCount > 0;
  } catch (error) {
    throw new Error(error);
  }
};

const findInvitationViaToken = async (token) => {
  const invitation = await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .findOne({ token });

  return invitation;
};

const updateStatusInvitationToAccepted = async (token) => {
  await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .updateOne(
      { token },
      { $set: { status: INVITATION_STATUS.ACCEPTED }, $unset: { token: "" } }
    );
};

const updateStatusInvitationToRejected = async (token) => {
  await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .updateOne(
      { token },
      { $set: { status: INVITATION_STATUS.REJECTED }, $unset: { token: "" } }
    );
};

const updatePendingInvitationStatus = async (invitationId, status) => {
  await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .updateOne(
      { _id: new ObjectId(invitationId) },
      { $set: { status: status, updatedAt: Date.now() } }
    );
};

const updateStatusInvitation = async (invitationId, status) => {
  await GET_DB()
    .collection(INVITATION_COLLECTION_NAME)
    .updateOne(
      { _id: new ObjectId(invitationId) },
      { $set: { status: status, updatedAt: Date.now() } }
    );
};

export const invitationModel = {
  INVITATION_COLLECTION_NAME,
  INVITATION_COLLECTION_SCHEMA,
  createInvitation,
  findInvitationViaToken,
  updateStatusInvitationToAccepted,
  updateStatusInvitationToRejected,
  updatePendingInvitationStatus,
  updateStatusInvitation,
};
