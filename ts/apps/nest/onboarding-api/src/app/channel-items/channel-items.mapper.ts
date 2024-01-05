import {
  ChannelItemSearchParam,
  ChannelItem,
  StationChannelItemSearchParam,
  StationChannelItem,
} from '@*company-data-covered*/consumer-web-types';

const SearchChannelItemToStationSearchChannelItem = (
  input: ChannelItemSearchParam
): StationChannelItemSearchParam => {
  const output: StationChannelItemSearchParam = {
    id: input.id,
    channel_id: input.channelId,
    market_id: input.marketId,
    channel_name: input.channelName,
    patient_id: input.patientId,
    lat: input.lat,
    lng: input.lng,
    phone: input.phone,
  };

  return output;
};

const ChannelItemToStationChannelItem = (
  input: ChannelItem
): StationChannelItem => {
  const output: StationChannelItem = {
    id: input.id,
    address_2_old: input.address2Old,
    address_old: input.addressOld,
    agreement: input.agreement,
    blended_bill: input.blendedBill,
    blended_description: input.blendedDescription,
    case_policy_number: input.casePolicyNumber,
    channel_id: input.channelId,
    city_old: input.cityOld,
    contact_person: input.contactPerson,
    created_at: input.createdAt,
    deactivated_at: input.deactivatedAt,
    email: input.email,
    emr_provider_id: input.emrProviderId,
    er_diversion: input.erDiversion,
    hospitalization_diversion: input.hospitalizationDiversion,
    market_id: input.marketId,
    market_name: input.marketName,
    name: input.name,
    nine_one_one_diversion: input.nineOneOneDiversion,
    observation_diversion: input.observationDiversion,
    phone: input.phone,
    preferred_partner: input.preferredPartner,
    preferred_partner_description: input.preferredPartnerDescription,
    prepopulate_based_on_address: input.prepopulateBasedOnAddress,
    prepopulate_based_on_eligibility_file:
      input.prepopulateBasedOnEligibilityFile,
    selected_with_last_cr_id: input.selectedWithLastCrId,
    selected_with_origin_phone: input.selectedWithOriginPhone,
    bypass_screening_protocol: input.bypassScreeningProtocol,
    send_clinical_note: input.sendClinicalNote,
    send_note_automatically: input.sendNoteAutomatically,
    snf_credentials: input.snfCredentials,
    source_name: input.sourceName,
    state_old: input.stateOld,
    type_name: input.typeName,
    updated_at: input.updatedAt,
    zipcode_old: input.zipcodeOld,
  };

  return output;
};

export default {
  SearchChannelItemToStationSearchChannelItem,
  ChannelItemToStationChannelItem,
};
