import * as faker from 'faker';
import {
  CurrentState,
  DashboardCareRequest,
} from '../types/dashboard-care-request';
import {
  buildMockDashboardCareRequest,
  buildMockDashboardProvider,
} from '../mocks/dashboard-care-request.mock';
import { CareRequestStatusText } from '../../care-request/enums/care-request-status.enum';

describe(`${DashboardCareRequest.name}`, () => {
  describe(`${DashboardCareRequest.prototype.toCareRequestDto.name}`, () => {
    describe(`With defined providers`, () => {
      test(`Transforms correctly - Single Provider`, () => {
        const mockProvider = buildMockDashboardProvider();
        const mock = buildMockDashboardCareRequest({
          providers: [mockProvider],
        });

        const result = mock.toCareRequestDto();

        expect(result.providers).toStrictEqual([
          {
            id: mockProvider.id,
            firstName: mockProvider.first_name,
            lastName: mockProvider.last_name,
            providerProfileCredentials:
              mockProvider.provider_profile_credentials,
            providerImageTinyUrl: mockProvider.provider_image_tiny_url,
            providerProfilePosition: mockProvider.provider_profile_position,
          },
        ]);
      });

      test(`Transforms correctly - Multiple Providers`, () => {
        const mockProviderFirst = buildMockDashboardProvider();
        const mockProviderLast = buildMockDashboardProvider();
        const mock = buildMockDashboardCareRequest({
          providers: [mockProviderFirst, mockProviderLast],
        });

        const result = mock.toCareRequestDto();

        expect(result.providers).toStrictEqual([
          {
            id: mockProviderFirst.id,
            firstName: mockProviderFirst.first_name,
            lastName: mockProviderFirst.last_name,
            providerProfileCredentials:
              mockProviderFirst.provider_profile_credentials,
            providerImageTinyUrl: mockProviderFirst.provider_image_tiny_url,
            providerProfilePosition:
              mockProviderFirst.provider_profile_position,
          },
          {
            id: mockProviderLast.id,
            firstName: mockProviderLast.first_name,
            lastName: mockProviderLast.last_name,
            providerProfileCredentials:
              mockProviderLast.provider_profile_credentials,
            providerImageTinyUrl: mockProviderLast.provider_image_tiny_url,
            providerProfilePosition: mockProviderLast.provider_profile_position,
          },
        ]);
      });

      test(`undefined patient`, () => {
        const mock = buildMockDashboardCareRequest({
          patient: null,
        });

        const result = mock.toCareRequestDto();

        expect(result.patient).toStrictEqual(null);
      });

      test(`Filters out virtual doctors`, () => {
        const mockProvider = buildMockDashboardProvider({
          provider_profile_position: 'virtual doctor',
        });
        const mock = buildMockDashboardCareRequest({
          providers: [mockProvider],
        });

        const result = mock.toCareRequestDto();

        expect(result.providers).toStrictEqual([]);
      });
    });

    describe(`With no defined providers`, () => {
      test(`Transforms correctly - Empty Array`, () => {
        const mock = buildMockDashboardCareRequest({
          providers: [],
        });

        const result = mock.toCareRequestDto();

        expect(result.providers).toStrictEqual([]);
      });

      test(`Transforms correctly - null`, () => {
        const mock = buildMockDashboardCareRequest({
          providers: undefined,
        });

        const result = mock.toCareRequestDto();

        expect(result.providers).toStrictEqual([]);
      });

      test(`Transforms correctly - undefined`, () => {
        const mock = buildMockDashboardCareRequest({
          providers: undefined,
        });

        const result = mock.toCareRequestDto();

        expect(result.providers).toStrictEqual([]);
      });
    });
  });

  describe(`With current states`, () => {
    test(`Transforms correctly`, () => {
      const mockCurrentStates: CurrentState[] = [
        {
          id: faker.datatype.number(),
          name: CareRequestStatusText.Requested,
          started_at: faker.datatype.datetime().toUTCString(),
          created_at: faker.datatype.datetime().toUTCString(),
          updated_at: faker.datatype.datetime().toUTCString(),
          status_index: 0,
        },
      ];
      const mock = buildMockDashboardCareRequest({
        current_states: mockCurrentStates,
      });

      const result = mock.toCareRequestDto();

      expect(result.currentState).toHaveLength(mockCurrentStates.length);
      result.currentState.forEach((state, i) => {
        expect(result.currentState[i].id).toStrictEqual(
          mockCurrentStates[i].id
        );
        expect(result.currentState[i].name).toStrictEqual(
          mockCurrentStates[i].name
        );
        expect(result.currentState[i].startedAt).toStrictEqual(
          mockCurrentStates[i].started_at
        );
        expect(result.currentState[i].createdAt).toStrictEqual(
          mockCurrentStates[i].created_at
        );
        expect(result.currentState[i].updatedAt).toStrictEqual(
          mockCurrentStates[i].updated_at
        );
        expect(result.currentState[i].statusIndex).toStrictEqual(
          mockCurrentStates[i].status_index
        );
      });
    });
  });

  describe(`Without current states`, () => {
    test(`Transforms correctly - Null`, () => {
      const mock = buildMockDashboardCareRequest({
        current_states: undefined,
      });

      const result = mock.toCareRequestDto();

      expect(result.currentState).toHaveLength(0);
    });

    test(`Transforms correctly - Undefined`, () => {
      const mock = buildMockDashboardCareRequest({
        current_states: undefined,
      });

      const result = mock.toCareRequestDto();

      expect(result.currentState).toHaveLength(0);
    });
  });
});
