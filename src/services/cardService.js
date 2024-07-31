import { StatusCodes } from "http-status-codes";
import ApiError from "~/utils/ApiError";
// import { cloneDeep } from 'lodash'

// import { slugify } from '~/utils/formatters'
import { cardModel } from "~/models/cardModel";
import { columnModel } from "~/models/columnModel";

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody,
    };

    const createdCard = await cardModel.createNew(newCard);
    const getNewCard = await cardModel.findOneById(
      createdCard.insertedId.toString()
    );

    if (getNewCard) {
      // xử lý cấu trúc data trước khi trả data về
      // getNewCard.cards = []

      // cập nhật mảng cardOrderIds trong collection boards
      await columnModel.pushCardOrderIds(getNewCard);
    }

    return getNewCard;
  } catch (error) {
    throw error;
  }
};

const deleteItem = async (cardId) => {
  try {
    const targetCard = await cardModel.findOneById(cardId);
    // console.log('targetCard:', targetCard)

    if (!targetCard) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Card is not found");
    }

    // xóa card
    await cardModel.deleteOneById(cardId);

    // xóa cardId trong mảng cardOrderIds của board chứa nó
    await columnModel.pullCardOrderIds(targetCard);

    return { deleteResult: "This Card have been deleted successfully!" };
  } catch (error) {
    throw error;
  }
};

const updateCard = async (cardId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now(),
    };

    // const updatedCard =
    await cardModel.updateCard(cardId, updateData);

    return { modifyCardResult: "Card has been modified successfully!" };
  } catch (error) {
    throw error;
  }
};

export const cardService = {
  createNew,
  deleteItem,
  updateCard,
};
