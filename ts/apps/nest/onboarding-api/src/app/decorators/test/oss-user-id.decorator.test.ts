import { mockDeep } from 'jest-mock-extended';
import { OSSUser, ossUserIdParamFactory } from '../oss-user-id.decorator';
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { USER_TOKEN_PROPS_KEY } from '../oss-user-id.decorator';

const MOCK_REQUEST_EMPTY_USER: OSSUser = {};

const MOCK_REQUEST_USER_WITH_EMPTY_PROPS: OSSUser = {
  [USER_TOKEN_PROPS_KEY]: {},
};

const MOCK_REQUEST_USER_WITH_PROVIDER_ID: OSSUser = {
  [USER_TOKEN_PROPS_KEY]: {
    identity_provider_user_id: 'test_identity_provider_user_id',
  },
};

const mockCtx = mockDeep<ExecutionContext>();
const mockHttpArgumentsHost = mockDeep<HttpArgumentsHost>();
mockCtx.switchToHttp.mockReturnValue(mockHttpArgumentsHost);

describe(`${ossUserIdParamFactory.name}`, () => {
  it('should throw bad request err undefined when request is missing a user', () => {
    mockHttpArgumentsHost.getRequest.mockReturnValueOnce({});
    expect(() => ossUserIdParamFactory(null, mockCtx)).toThrow(
      BadRequestException
    );
  });

  it('should return undefined when user does not have provider id', () => {
    mockHttpArgumentsHost.getRequest.mockReturnValueOnce({
      user: MOCK_REQUEST_EMPTY_USER,
    });
    expect(() => ossUserIdParamFactory(null, mockCtx)).toThrow(
      BadRequestException
    );
  });

  it('should return undefined when user does not have provider id', () => {
    mockHttpArgumentsHost.getRequest.mockReturnValueOnce({
      user: MOCK_REQUEST_USER_WITH_EMPTY_PROPS,
    });
    expect(() => ossUserIdParamFactory(null, mockCtx)).toThrow(
      BadRequestException
    );
  });

  it('should return user provider id', () => {
    mockHttpArgumentsHost.getRequest.mockReturnValueOnce({
      user: MOCK_REQUEST_USER_WITH_PROVIDER_ID,
    });
    const providerId = ossUserIdParamFactory(null, mockCtx);
    expect(providerId).toEqual(
      MOCK_REQUEST_USER_WITH_PROVIDER_ID[USER_TOKEN_PROPS_KEY]
        .identity_provider_user_id
    );
  });
});
