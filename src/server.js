
import express from 'express'
import exitHook from 'async-exit-hook'
import cors from 'cors'

import { corsOptions } from '~/config/cors'
import { env } from '~/config/environment'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'


const START_SERVER = () => {
  const app = express()

  // xử lý CORS
  app.use(cors(corsOptions))

  // enable req.body json data
  app.use(express.json())

  // use APIs V1
  app.use('/v1', APIs_V1)

  // middleware handle errors
  app.use(errorHandlingMiddleware)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`Hello im ${env.AUTHOR}, I am running at http://${ env.APP_HOST }:${ env.APP_PORT }/`)
  })

  // clean up trc khi dừng server
  exitHook(() => {
    console.log('server is shutted down')
    
    CLOSE_DB()

    console.log('disconnected to mongoDB')
  })
}

// chỉ khi kết nối thành công tới db thì mới start server từ phía back-end lên
(async () => {
  try {
    console.log('connecting to mongoDB cloud atlas')
    
    await CONNECT_DB()

    console.log('connected to mongoDB cloud atlas')

    // cần check xem đã tồn tại port hay chưa
    // nếu đã tồn tại thì cần kill port. và sau đó mới khởi tạo
    
    // khởi động server back-end sau khi connect DB thành công
    START_SERVER()
  } catch (error) {
    console.error(error)
    process.exit(0)
  }
})()

// CONNECT_DB()
//   .then(() => console.log('connected to mongoDB cloud atlas'))
//   .then(() => START_SERVER())
//   .catch(error => {
//     console.error(error)
//     process.exit(0)
//   })