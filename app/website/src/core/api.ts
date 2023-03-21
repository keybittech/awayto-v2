export type DbError = Error & {
  schema: string,
  table: string,
  column: string,
  dataType: string,
  constraint: string
};

export type ApiErrorResponse = Partial<Error> & {
  [prop: string]: unknown;
  requestId: string;
  reason?: string;
}

export type ApiInternalError = Error & {
  response: {
    status: number
  };
  data: {
    errorMessage: string;
  };
}

class ErrorType extends Error {
  constructor(message?: string & unknown) {
    super(message); 
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default { ErrorType }