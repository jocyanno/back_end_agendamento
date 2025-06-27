// _errors/app-error.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public name = "AppError"
  ) {
    super(message);
  }
}
