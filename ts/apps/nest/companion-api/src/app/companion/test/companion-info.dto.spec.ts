import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import {
  buildMockCareRequest,
  buildMockProvider,
} from '../../care-request/mocks/care-request.repository.mock';
import { ProviderPosition } from '../../dashboard/types/dashboard-care-request';
import {
  CompanionInfoDto,
  CompanionProviderPositionMap,
} from '../dto/companion-info.dto';
import { buildMockCompanionLinkWithTasks } from '../mocks/companion-link.mock';

describe(`${CompanionInfoDto.name}`, () => {
  describe(`${CompanionInfoDto.fromCareRequest.name}`, () => {
    test(`undefined patient defaults name fields to empty string`, () => {
      const mockCareRequest: CareRequestDto = buildMockCareRequest({
        patient: undefined,
      });

      const mockCompanionLink = buildMockCompanionLinkWithTasks();

      const result = CompanionInfoDto.fromCareRequest(
        mockCareRequest,
        mockCompanionLink.tasks
      );

      expect(result.patientFirstName).toBe('');
      expect(result.patientLastName).toBe('');
    });

    describe('formats provider positions', () => {
      const appString = 'advanced practice provider';

      test(`${appString} -> ${CompanionProviderPositionMap[appString]}`, () => {
        const mockCareRequest: CareRequestDto = buildMockCareRequest({
          providers: [
            buildMockProvider({
              providerProfilePosition: appString,
            }),
          ],
        });

        const mockCompanionLink = buildMockCompanionLinkWithTasks();

        const result = CompanionInfoDto.fromCareRequest(
          mockCareRequest,
          mockCompanionLink.tasks
        );

        expect(result.providers[0].providerProfilePosition).toStrictEqual(
          CompanionProviderPositionMap[appString]
        );
      });

      const npString = 'nurse practitioner';

      test(`${npString} -> ${CompanionProviderPositionMap[npString]}`, () => {
        const mockCareRequest: CareRequestDto = buildMockCareRequest({
          providers: [
            buildMockProvider({
              providerProfilePosition: npString,
            }),
          ],
        });

        const mockCompanionLink = buildMockCompanionLinkWithTasks();

        const result = CompanionInfoDto.fromCareRequest(
          mockCareRequest,
          mockCompanionLink.tasks
        );

        expect(result.providers[0].providerProfilePosition).toStrictEqual(
          CompanionProviderPositionMap[npString]
        );
      });

      const emtString = 'emt';

      test(`${emtString} -> ${CompanionProviderPositionMap[emtString]}`, () => {
        const mockCareRequest: CareRequestDto = buildMockCareRequest({
          providers: [
            buildMockProvider({
              providerProfilePosition: emtString,
            }),
          ],
        });
        const mockCompanionLink = buildMockCompanionLinkWithTasks();

        const result = CompanionInfoDto.fromCareRequest(
          mockCareRequest,
          mockCompanionLink.tasks
        );

        expect(result.providers[0].providerProfilePosition).toStrictEqual(
          CompanionProviderPositionMap[emtString]
        );
      });

      test(`Defaults to "Tech"`, () => {
        const mockCareRequest: CareRequestDto = buildMockCareRequest({
          providers: [
            buildMockProvider({
              providerProfilePosition: 'not a position' as ProviderPosition,
            }),
          ],
        });

        const mockCompanionLink = buildMockCompanionLinkWithTasks();

        const result = CompanionInfoDto.fromCareRequest(
          mockCareRequest,
          mockCompanionLink.tasks
        );

        expect(result.providers[0].providerProfilePosition).toStrictEqual(
          'Tech'
        );
      });
    });
  });
});
