/**
 * Định nghĩa riêng một Class ApiError kế thừa class Error sẵn (điều này cần thiết và là Best Practice vì class Error nó là class built-in sẵn)
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    // có super mới dùng đc this
    // và vì thằng cha (Error) có property message rồi nên gọi nó luôn trong super cho gọn
    super(message)

    // Tên của cái custom Error này, nếu không set thì mặc định nó sẽ kế thừa là "Error"
    this.name = 'ApiError'

    // Gán thêm http status code của ở đây
    this.statusCode = statusCode

    // Ghi lại Stack Trace để thuận tiện cho việc debug
    Error.captureStackTrace(this, this.constructor)
  }
}

export default ApiError
