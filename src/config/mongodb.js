import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

// khởi tạo một đối tượng trelloDatabaseInstance ban đầu là null (vì chưa connect)
let trelloDatabaseInstance = null

// khởi tạo một đối tượng mongoClientInstance connect tới MongoDB
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

// kết nối tới databse
export const CONNECT_DB = async () => {
  // gọi kết nối tới mongoDB Atlas với URI đã khai báo trong mongoClientInstance
  await mongoClientInstance.connect()

  // kết nối thành công thì lấy ra database theo tên và gán vào biến trelloDatabaseInstance
  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
}

// đóng kết nối với DB
export const CLOSE_DB = async () => {
  await mongoClientInstance.close()
}

// function GET_DB này (không có async) có nhiệm vụ export ra cái Trello Database Instance sau khi đã connect thành công tới MongoDB để sử dụng ở nhiều chỗ khác nhau trong code
// lưu ý phải đảm bảo chỉ luôn gọi cái GET_DB này sau khi kết nối thành công
export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('Must connect to Database first!')
  return trelloDatabaseInstance
}