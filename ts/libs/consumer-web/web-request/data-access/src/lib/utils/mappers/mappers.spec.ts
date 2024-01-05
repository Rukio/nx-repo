import {
  mockCareRequestResult,
  mockedMarket,
  mockZipCodeDetails,
} from '@*company-data-covered*/station/data-access';
import { mockCreateCareRequestDataPayload } from '../../feature';
import {
  toCareRequestResult,
  toCreateCareRequestPayload,
  toMarketDetails,
  toZipCodeDetails,
} from './mappers';

describe('utils mappers', () => {
  describe('toCreateCareRequestPayload', () => {
    it('should transform care request form data to care request domain request payload', () => {
      const result = toCreateCareRequestPayload(
        mockCreateCareRequestDataPayload
      );
      expect(result).toEqual({
        care_request: {
          request_type: mockCreateCareRequestDataPayload.type,
          street_address_1:
            mockCreateCareRequestDataPayload.address.streetAddress1,
          street_address_2:
            mockCreateCareRequestDataPayload.address.streetAddress2,
          city: mockCreateCareRequestDataPayload.address.city,
          state: mockCreateCareRequestDataPayload.address.state,
          zipcode: mockCreateCareRequestDataPayload.address.postalCode,
          chief_complaint: mockCreateCareRequestDataPayload.complaint.symptoms,
          patient_attributes: {
            first_name: mockCreateCareRequestDataPayload.patient.firstName,
            last_name: mockCreateCareRequestDataPayload.patient.lastName,
            mobile_number: mockCreateCareRequestDataPayload.patient.phone,
            patient_email: mockCreateCareRequestDataPayload.patient.email,
            dob: mockCreateCareRequestDataPayload.patient.birthday,
            gender: mockCreateCareRequestDataPayload.patient.sex,
          },
          caller_attributes: {
            relationship_to_patient:
              mockCreateCareRequestDataPayload.caller.relationshipToPatient,
            first_name: mockCreateCareRequestDataPayload.caller.firstName,
            last_name: mockCreateCareRequestDataPayload.caller.lastName,
            origin_phone: mockCreateCareRequestDataPayload.caller.phone,
          },
          patient_preferred_eta_start:
            mockCreateCareRequestDataPayload.patientPreferredEta
              .patientPreferredEtaStart,
          patient_preferred_eta_end:
            mockCreateCareRequestDataPayload.patientPreferredEta
              .patientPreferredEtaEnd,
          statsig_stable_id: mockCreateCareRequestDataPayload.statsigStableId,
          marketing_meta_data: {
            source: mockCreateCareRequestDataPayload.marketingMetaData.source,
          },
        },
        'g-recaptcha-response-data': {
          request_care: mockCreateCareRequestDataPayload.token,
        },
      });
    });
  });

  describe('toCareRequestResult', () => {
    it('should transform domain model to payment data', () => {
      const result = toCareRequestResult(mockCareRequestResult);
      expect(result).toEqual({
        statsigCareRequestId: mockCareRequestResult.care_request_id,
        success: mockCareRequestResult.success,
      });
    });
  });

  describe('toZipCodeDetails', () => {
    it('should transform domain model to zip code details data', () => {
      const result = toZipCodeDetails(mockZipCodeDetails);
      expect(result).toEqual({
        id: mockZipCodeDetails.id,
        marketId: mockZipCodeDetails.market_id,
        billingCityId: mockZipCodeDetails.billing_city_id,
      });
    });

    it('should return null if no domain data', () => {
      const result = toZipCodeDetails();
      expect(result).toBeNull();
    });
  });

  describe('toMarketDetails', () => {
    it('should transform domain model to market details data', () => {
      const result = toMarketDetails(mockedMarket);
      expect(result).toEqual({
        allowEtaRangeModification: mockedMarket.allow_eta_range_modification,
        autoAssignTypeOrDefault: mockedMarket.auto_assign_type_or_default,
        autoAssignable: mockedMarket.auto_assignable,
        contactEmail: mockedMarket.contact_email,
        enabled: mockedMarket.enabled,
        genesysId: mockedMarket.genesys_id,
        id: mockedMarket.id,
        marketName: mockedMarket.market_name,
        name: mockedMarket.name,
        nextDayEtaEnabled: mockedMarket.next_day_eta_enabled,
        only911: mockedMarket.only_911,
        primaryInsuranceSearchEnabled:
          mockedMarket.primary_insurance_search_enabled,
        schedules: [
          {
            closeAt: mockedMarket.schedules[0].close_at,
            createdAt: mockedMarket.schedules[0].created_at,
            days: mockedMarket.schedules[0].days,
            id: mockedMarket.schedules[0].id,
            openAt: mockedMarket.schedules[0].open_at,
            openDuration: mockedMarket.schedules[0].open_duration,
            schedulableId: mockedMarket.schedules[0].schedulable_id,
            schedulableType: mockedMarket.schedules[0].schedulable_type,
            updatedAt: mockedMarket.schedules[0].updated_at,
          },
        ],
        selfPayRate: mockedMarket.self_pay_rate,
        shortName: mockedMarket.short_name,
        state: mockedMarket.state,
        stateLocale: {
          abbreviation: mockedMarket.state_locale.abbreviation,
          id: mockedMarket.state_locale.id,
          name: mockedMarket.state_locale.name,
          screenerLine: {
            genesysId: mockedMarket.state_locale.screener_line.genesys_id,
            id: mockedMarket.state_locale.screener_line.id,
            phoneNumber: mockedMarket.state_locale.screener_line.phone_number,
            queueName: mockedMarket.state_locale.screener_line.queue_name,
          },
        },
        timezone: mockedMarket.timezone,
        tzName: mockedMarket.tz_name,
        tzShortName: mockedMarket.tz_short_name,
      });
    });

    it('should transform domain model to market details data without state locale', () => {
      const result = toMarketDetails({
        ...mockedMarket,
        state_locale: undefined,
      });
      expect(result).toEqual({
        allowEtaRangeModification: mockedMarket.allow_eta_range_modification,
        autoAssignTypeOrDefault: mockedMarket.auto_assign_type_or_default,
        autoAssignable: mockedMarket.auto_assignable,
        contactEmail: mockedMarket.contact_email,
        enabled: mockedMarket.enabled,
        genesysId: mockedMarket.genesys_id,
        id: mockedMarket.id,
        marketName: mockedMarket.market_name,
        name: mockedMarket.name,
        nextDayEtaEnabled: mockedMarket.next_day_eta_enabled,
        only911: mockedMarket.only_911,
        primaryInsuranceSearchEnabled:
          mockedMarket.primary_insurance_search_enabled,
        schedules: [
          {
            closeAt: mockedMarket.schedules[0].close_at,
            createdAt: mockedMarket.schedules[0].created_at,
            days: mockedMarket.schedules[0].days,
            id: mockedMarket.schedules[0].id,
            openAt: mockedMarket.schedules[0].open_at,
            openDuration: mockedMarket.schedules[0].open_duration,
            schedulableId: mockedMarket.schedules[0].schedulable_id,
            schedulableType: mockedMarket.schedules[0].schedulable_type,
            updatedAt: mockedMarket.schedules[0].updated_at,
          },
        ],
        selfPayRate: mockedMarket.self_pay_rate,
        shortName: mockedMarket.short_name,
        state: mockedMarket.state,
        timezone: mockedMarket.timezone,
        tzName: mockedMarket.tz_name,
        tzShortName: mockedMarket.tz_short_name,
      });
    });

    it('should transform domain model to market details data without screener line', () => {
      const result = toMarketDetails({
        ...mockedMarket,
        state_locale: {
          ...mockedMarket.state_locale,
          screener_line: undefined,
        },
      });
      expect(result).toEqual({
        allowEtaRangeModification: mockedMarket.allow_eta_range_modification,
        autoAssignTypeOrDefault: mockedMarket.auto_assign_type_or_default,
        autoAssignable: mockedMarket.auto_assignable,
        contactEmail: mockedMarket.contact_email,
        enabled: mockedMarket.enabled,
        genesysId: mockedMarket.genesys_id,
        id: mockedMarket.id,
        marketName: mockedMarket.market_name,
        name: mockedMarket.name,
        nextDayEtaEnabled: mockedMarket.next_day_eta_enabled,
        only911: mockedMarket.only_911,
        primaryInsuranceSearchEnabled:
          mockedMarket.primary_insurance_search_enabled,
        schedules: [
          {
            closeAt: mockedMarket.schedules[0].close_at,
            createdAt: mockedMarket.schedules[0].created_at,
            days: mockedMarket.schedules[0].days,
            id: mockedMarket.schedules[0].id,
            openAt: mockedMarket.schedules[0].open_at,
            openDuration: mockedMarket.schedules[0].open_duration,
            schedulableId: mockedMarket.schedules[0].schedulable_id,
            schedulableType: mockedMarket.schedules[0].schedulable_type,
            updatedAt: mockedMarket.schedules[0].updated_at,
          },
        ],
        selfPayRate: mockedMarket.self_pay_rate,
        shortName: mockedMarket.short_name,
        state: mockedMarket.state,
        timezone: mockedMarket.timezone,
        tzName: mockedMarket.tz_name,
        tzShortName: mockedMarket.tz_short_name,
        stateLocale: {
          abbreviation: mockedMarket.state_locale.abbreviation,
          id: mockedMarket.state_locale.id,
          name: mockedMarket.state_locale.name,
        },
      });
    });

    it('should return null if no domain data', () => {
      const result = toMarketDetails();
      expect(result).toBeNull();
    });
  });
});
