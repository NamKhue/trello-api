import express from "express";

import { ROLE_TYPES } from "~/utils/constants";

import { upload } from "~/middlewares/uploadMiddleware";

import { fileController } from "~/controllers/fileController";

const Router = express.Router();

// Route for uploading files
Router.post("/upload/:id", upload.array("file"), fileController.uploadFiles);

// Route for fetching files
Router.get("/:id", fileController.getFiles);

// Route for deleting files
Router.delete("/:id", fileController.deleteFile);

export const fileRoute = Router;
