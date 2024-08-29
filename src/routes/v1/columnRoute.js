import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";
import {
  authorizeRoleBoardForBoardUser,
  authorizeRoleInBoardViaColumnId,
} from "~/middlewares/authorizeRole";

import { ROLE_TYPES } from "~/utils/constants";

import { columnValidation } from "~/validations/columnValidation";
import { columnController } from "~/controllers/columnController";

const Router = express.Router();

Router.post(
  "/",
  authenticateJWT,
  authorizeRoleBoardForBoardUser([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  columnValidation.createNew,
  columnController.createNew
);

Router.put(
  "/:id",
  authenticateJWT,
  authorizeRoleInBoardViaColumnId([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  columnValidation.update,
  columnController.update
);

Router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoleInBoardViaColumnId([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  columnValidation.deleteColumnItem,
  columnController.deleteColumnItem
);

export const columnRoute = Router;
