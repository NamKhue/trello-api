import express from 'express'
import { StatusCodes } from 'http-status-codes'

import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'Note: API get list boards' })
  })
  .post(boardValidation.createNew, boardController.createNew)

Router.route('/:id')
  .get(boardController.getDetails)
  .put(boardValidation.update, boardController.update)

// API hỗ trợ việc di chuyển card giữa 2 columns
Router.route('/supports/moving_card')
  .put(boardValidation.moveCardToDifferentColumn, boardController.moveCardToDifferentColumn)

// boardRoute == boardAPI (tuy là một nhưng vì dùng express nên đổi tên thành routes thay vì là apis)
export const boardRoute = Router