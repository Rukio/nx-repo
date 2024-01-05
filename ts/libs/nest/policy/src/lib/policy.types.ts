import { PolicyActor } from '@*company-data-covered*/nest/auth';

export type QueryInput<T> = {
  actor: PolicyActor;
  resource?: T;
};

export type QueryRequest<T> = {
  query: string;
  input: QueryInput<T>;
};

export type QueryResult<T> = {
  result: T;
};

export type PolicyServiceResult<T> =
  | QueryResults<T>
  | NoQueryResult
  | QueryError;

export type QueryResults<T> = {
  result: QueryResult<T>[];
};

export type NoQueryResult = Record<string, never>;

export type QueryError = {
  code: string;
  message: string;
  errors: {
    code: string;
    message: string;
    location: {
      file: string;
      row: number;
      col: number;
    }[];
    details: {
      line: string;
      iddx: number;
    };
  };
};

export const isQueryResults = <T>(
  q: PolicyServiceResult<T>
): q is QueryResults<T> => {
  return 'result' in q;
};

export const isQueryError = <T>(q: PolicyServiceResult<T>): q is QueryError => {
  return 'code' in q;
};

export const isNoQueryResult = <T>(
  q: PolicyServiceResult<T>
): q is NoQueryResult => {
  return !isQueryResults(q) && !isQueryError(q);
};

export const extractPolicyResult = <T>(
  result: PolicyServiceResult<T>,
  index = 0
): T | null => {
  if (isQueryError(result)) {
    return null;
  } else if (isQueryResults(result)) {
    const queryResult = result;

    if (queryResult.result.length <= index) {
      return null;
    }

    return queryResult.result[index].result;
  }

  return null;
};
