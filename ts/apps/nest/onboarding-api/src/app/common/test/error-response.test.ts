import { HttpException } from '@nestjs/common';
import errorResponse, {
  getErrorCode,
  getErrorMessage,
} from '../error-response';

describe('Error', () => {
  describe('Error Response', () => {
    it('should throw correct exception error', () => {
      expect(() =>
        errorResponse({ response: { data: 'Test', status: 422 } })
      ).toThrow(HttpException);
    });

    it('should throw correct exception when error is undefined', () => {
      expect(() => errorResponse(undefined)).toThrow(HttpException);
    });
  });

  describe('Error Code', () => {
    it('should be 500, if error is empty', () => {
      expect(getErrorCode({})).toEqual(500);
    });

    it('should be 400, if status is 400', () => {
      expect(getErrorCode({ response: { status: 400 } })).toEqual(400);
    });

    it('should be 404, if statusCode is 404', () => {
      expect(getErrorCode({ response: { statusCode: 404 } })).toEqual(404);
    });

    it('should be 403, if grpc error is permission denied', () => {
      expect(getErrorCode({ code: 7 })).toEqual(403);
    });

    it('should be 401, if grpc error is unauthorized', () => {
      expect(getErrorCode({ code: 16 })).toEqual(401);
    });

    it('should be 404, if grpc error is not found', () => {
      expect(getErrorCode({ code: 5 })).toEqual(404);
    });

    it('should be 400, if grpc request is canceled or incorrect parameters are sent', () => {
      expect(getErrorCode({ code: 3 })).toEqual(400);
    });
  });

  describe('Error Message', () => {
    it('should be failed request', () => {
      expect(getErrorMessage('failed request')).toEqual('failed request');
    });

    it('should be permission denied, if message contains permission denied', () => {
      expect(
        getErrorMessage('7 Permission denied: failed policy check')
      ).toEqual('Permission Denied');
    });

    it('should be undefined if no error message', () => {
      expect(getErrorMessage()).toEqual(undefined);
    });
  });
});
