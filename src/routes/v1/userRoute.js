import express from "express";

import { authenticateJWT } from "~/middlewares/authenticateJWT";

import { userValidation } from "~/validations/userValidation";
import { userController } from "~/controllers/userController";

const Router = express.Router();

Router.route("/register").post(
  userValidation.validateUser,
  userController.register
);

Router.route("/login").post(userValidation.validateEmail, userController.login);

Router.route("/").get(userController.getAllUsers);
Router.get("/:id", authenticateJWT, userController.getDetails).put(
  "/:id",
  authenticateJWT,
  userValidation.validateUserUpdate,
  userController.updateUserDetails
);

// Router.route("/:id", authenticateJWT)
//   .get(userController.getDetails)
//   .put(userValidation.validateUserUpdate, userController.updateUserDetails);

export const userRoute = Router;
