
import express from 'express'
import exitHook from 'async-exit-hook'
import { env } from '~/config/environment'

import { CONNECT_DB, CLOSE_DB, GET_DB } from '~/config/mongodb'


const START_SERVER = () => {
  const app = express()

  app.get('/', async (req, res) => {
    // console.log(await GET_DB().listCollections().toArray())
    res.end('<h1>Hello World!</h1><hr>')
  })

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Hello im ${env.AUTHOR}, I am running at http://${ env.APP_HOST }:${ env.APP_PORT }/`)
  })

  // clean up trc khi dừng server
  exitHook(() => CLOSE_DB())
}

// chỉ khi kết nối thành công tới db thì mới start server từ phía back-end lên
(async () => {
  try {
    console.log('connecting to mongoDB cloud atlas')
    await CONNECT_DB()

    console.log('connected to mongoDB cloud atlas')
    
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