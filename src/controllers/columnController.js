import { StatusCodes } from "http-status-codes";

import { columnService } from "~/services/columnService";

const createNew = async (req, res, next) => {
  try {
    const createdNewColumn = await columnService.createNew(req.body);

    res.status(StatusCodes.CREATED).json(createdNewColumn);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const columnId = req.params.id;

    const updatedColumn = await columnService.update(columnId, req.body);

    res.status(StatusCodes.OK).json(updatedColumn);
  } catch (error) {
    next(error);
  }
};

const deleteColumnItem = async (req, res, next) => {
  try {
    const columnId = req.params.id;
    const updatedColumn = await columnService.deleteColumnItem(columnId);

    res.status(StatusCodes.OK).json(updatedColumn);
  } catch (error) {
    next(error);
  }
};

export const columnController = {
  createNew,
  update,
  deleteColumnItem,
};
