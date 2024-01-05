import { FallbackProps } from 'react-error-boundary';
import { ResponseError } from '@*company-data-covered*/caremanager/data-access-types';
import { AccessDenied } from './AccessDenied';
import { SomethingWentWrong } from './SomethingWentWrong';

const AUTHORIZATION_ERRORS = [403, 401];

interface Props extends FallbackProps {
  error: Error | ResponseError;
}

export const ErrorStatus: React.FC<Props> = ({ error }) => {
  const status = error instanceof ResponseError && error.response.status;

  if (status && AUTHORIZATION_ERRORS.includes(status)) {
    return <AccessDenied />;
  }

  return <SomethingWentWrong />;
};
