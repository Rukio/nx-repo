import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { CompanionModule } from '../companion.module';
import { CompanionSerializer } from '../companion.serializer';
import { CompanionSessionUserModel } from '../companion.strategy';
import { buildMockSessionUser } from '../mocks/companion-session-user.mock';

describe(`${CompanionSerializer.name}`, () => {
  let serializer: CompanionSerializer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CompanionModule, CommonModule],
    }).compile();

    serializer = module.get<CompanionSerializer>(CompanionSerializer);
  });

  const mockDone = jest.fn<
    CallableFunction,
    { error: Error; user: CompanionSessionUserModel }[]
  >();

  const mockCompanionSessionUser = buildMockSessionUser();

  describe(`${CompanionSerializer.prototype.serializeUser.name}`, () => {
    test('call done with same user', () => {
      serializer.serializeUser(mockCompanionSessionUser, mockDone);

      expect(mockDone).toHaveBeenCalledWith(null, mockCompanionSessionUser);
    });
  });

  describe(`${CompanionSerializer.prototype.deserializeUser.name}`, () => {
    test('call done with same user', () => {
      serializer.deserializeUser(mockCompanionSessionUser, mockDone);

      expect(mockDone).toHaveBeenCalledWith(null, mockCompanionSessionUser);
    });
  });
});
