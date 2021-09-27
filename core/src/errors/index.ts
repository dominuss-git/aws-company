import { StatusCodes } from "http-status-codes"

export class CompanyError extends Error {
  constructor(
    message = "Internal Server Error", 
    readonly name = "CompanyError", 
    readonly code = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
  }

  serializeJSON() {
    const serializedBody: { [key: string]: any } = {
      name: this.name,
      code: this.code || this.name,
      message: this.message,
    };

    return serializedBody;
  }
}

export class BadRequestError extends CompanyError {
  constructor(message: string, code = StatusCodes.BAD_REQUEST) {
    super(message, "BadRequestError", code);
  }
}