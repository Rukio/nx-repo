import { HttpException } from '@nestjs/common';

// TODO: configure type for error object
export const getErrorCode = (error) => {
  if (error?.code && !isNaN(error.code)) {
    switch (error.code) {
      case 7:
        return 403;
      case 3:
      case 9:
      case 11:
        return 400;
      case 5:
        return 404;
      case 16:
        return 401;
      default:
        return 500;
    }
  }

  return error?.response?.status || error?.response?.statusCode || 500;
};

export const getErrorMessage = (msg?: string) =>
  msg?.toLowerCase().includes('permission denied') ? 'Permission Denied' : msg;

export default (error) => {
  throw new HttpException(
    {
      errors: error?.response?.data,
      message: getErrorMessage(error?.message),
      statusCode: getErrorCode(error),
    },
    getErrorCode(error)
  );
};
