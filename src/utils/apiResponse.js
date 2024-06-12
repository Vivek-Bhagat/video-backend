// class apiResponse {
//     constructor(status, message ="Success", data) {
//         this.status = status;
//         this.message = message;
//         this.data = data;
//         this.sucess= statusCode < 400
//     }
// }
class apiResponse {
  constructor(statusCode, message, data) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };
  }
}



export {apiResponse}