import { StatusCodes } from 'http-status-codes'

import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    // console.log('req.body:', req.body)

    // điều hướng dữ liệu sang tầng Service
    const createdNewBoard = await boardService.createNew(req.body)

    // có kết quả thì trả về phía client
    res.status(StatusCodes.CREATED).json(createdNewBoard)
    
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    // console.log('req.params:', req.params)

    const boardId = req.params.id

    // tương lai làm thêm cái userId để lấy dữ liệu board mà user đó được sở hữu/thêm vào
    const board = await boardService.getDetails(boardId)

    res.status(StatusCodes.OK).json(board)
    
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const boardId = req.params.id

    // tương lai làm thêm cái userId để lấy dữ liệu board mà user đó được sở hữu/thêm vào
    const updatedBoard = await boardService.update(boardId, req.body)

    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) {
    next(error)
  }
}

const moveCardToDifferentColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDifferentColumn(req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn
}