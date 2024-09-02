import express from "express";

import { ROLE_TYPES } from "~/utils/constants";

import { authenticateJWT } from "~/middlewares/authenticateJWT";
import {
  authorizeRoleBoardForBoardUser,
  authorizeRoleCardNotBoard,
} from "~/middlewares/authorizeRole";

import { commentController } from "~/controllers/commentController";

const Router = express.Router();

Router.get(
  "/get-comments/:id",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([
    ROLE_TYPES.CREATOR,
    ROLE_TYPES.OWNER,
    ROLE_TYPES.MEMBER,
  ]),
  commentController.getComments
);

Router.post(
  "/new-comment/:id",
  authenticateJWT,
  authorizeRoleCardNotBoard,
  commentController.createComment
);

Router.post(
  "/new-reply/:id",
  authenticateJWT,
  authorizeRoleCardNotBoard,
  commentController.createReply
);

export const commentRoute = Router;
