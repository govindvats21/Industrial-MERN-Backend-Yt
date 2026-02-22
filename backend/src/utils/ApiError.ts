class ApiError extends Error {
    // 1. Pehle properties define karni padengi (TS Rule)
    statusCode: number;
    data: any;
    success: boolean;
    errors: any[];

    constructor(
        statusCode: number, // Type batana zaroori hai
        message: string = "Something went wrong",
        errors: any[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };