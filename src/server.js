import express from "express";
import exitHook from "async-exit-hook";
import cors from "cors";
import { createServer } from "http";

import { env } from "~/config/environment";
import { CONNECT_DB, CLOSE_DB } from "~/config/mongodb";

import { corsOptions } from "~/config/cors";

import { APIs_V1 } from "~/routes/v1";
import { errorHandlingMiddleware } from "~/middlewares/errorHandlingMiddleware";

import { setupSocketIO } from "~/sockets/setupSocketIO";
import { startCronJobs } from "~/utils/notify system/cron";

const START_SERVER = () => {
  // const app = express();

  const app = express();
  const server = createServer(app);

  // xử lý CORS
  app.use(cors(corsOptions));

  // enable req.body json data
  app.use(express.json());

  // Setup Socket.IO
  setupSocketIO(server);

  // use APIs V1
  app.use("/v1", APIs_V1);

  // automatically popup notification about deadline
  startCronJobs();

  // middleware handle errors
  app.use(errorHandlingMiddleware);

  server.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(
      `Hello, i'm ${env.AUTHOR}, I am running at http://${env.APP_HOST}:${env.APP_PORT}/`
    );
    console.log("");
  });

  // clean up trc khi dừng server
  exitHook(() => {
    console.log("Server is shutted down");

    CLOSE_DB();

    console.log("Disconnected to mongoDB");
  });
};

// chỉ khi kết nối thành công tới db thì mới start server từ phía back-end lên
(async () => {
  try {
    console.log("Connecting to mongoDB cloud atlas ...");

    await CONNECT_DB();

    console.log("Successfully connected to mongoDB cloud atlas");

    // cần check xem đã tồn tại port hay chưa
    // nếu đã tồn tại thì cần kill port. và sau đó mới khởi tạo

    // khởi động server back-end sau khi connect DB thành công
    START_SERVER();
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
})();

// CONNECT_DB()
//   .then(() => console.log('connected to mongoDB cloud atlas'))
//   .then(() => START_SERVER())
//   .catch(error => {
//     console.error(error)
//     process.exit(0)
//   })
