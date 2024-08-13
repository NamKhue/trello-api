import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";
import { authorizeRoleBoardForBoardUser } from "~/middlewares/authorizeRole";
import { ROLE_TYPES } from "~/utils/constants";

import { boardUserValidation } from "~/validations/boardUserValidation";
import { boardUserController } from "~/controllers/boardUserController";

const Router = express.Router();

Router.get("/ownerBoards", authenticateJWT, boardUserController.getOwnerBoards);
Router.get(
  "/memberBoards",
  authenticateJWT,
  boardUserController.getMemberBoards
);

Router.get("/allMembers", authenticateJWT, boardUserController.getAllMembers);

Router.get("/roleOfBoard", authenticateJWT, boardUserController.getRoleOfBoard);

Router.post(
  "/invite",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  boardUserController.inviteUser
);
Router.get(
  "/accept-invitation",
  authenticateJWT,
  boardUserController.acceptInvitation
);
Router.get(
  "/reject-invitation",
  authenticateJWT,
  boardUserController.declineInvitation
);

Router.post(
  "/add-user",
  // authenticateJWT,
  boardUserController.addUser
);
Router.post(
  "/remove-user",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  boardUserController.removeUser
);

Router.post(
  "/changeRole",
  authenticateJWT,
  // authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  boardUserValidation.validateRoleChange,
  boardUserController.changeRole
);

export const boardUserRoute = Router;
