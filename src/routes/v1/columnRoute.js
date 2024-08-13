import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";
import {
  authorizeRoleBoardForBoardUser,
  authorizeRoleColumn,
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
  authorizeRoleColumn([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  columnValidation.update,
  columnController.update
);

Router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoleColumn([ROLE_TYPES.CREATOR, ROLE_TYPES.OWNER]),
  columnValidation.deleteItem,
  columnController.deleteItem
);

export const columnRoute = Router;
