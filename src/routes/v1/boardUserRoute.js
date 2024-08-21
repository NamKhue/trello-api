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

Router.post("/add-user", boardUserController.addUser);
Router.post(
  "/remove-user",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  boardUserController.removeUser
);

Router.post(
  "/changeRole",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  boardUserValidation.validateRoleChange,
  boardUserController.changeRole
);

export const boardUserRoute = Router;
