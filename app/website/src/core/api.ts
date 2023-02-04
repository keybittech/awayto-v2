export type DbError = Error & {
  schema: string,
  table: string,
  column: string,
  dataType: string,
  constraint: string
};

export type ApiErrorResponse = Partial<Error> & {
  requestId: string,
  reason?: string
}

class ErrorType extends Error {
  constructor(message?: string & unknown) {
    super(message); 
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default { ErrorType }