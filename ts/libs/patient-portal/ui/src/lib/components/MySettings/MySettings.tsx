import { FC } from 'react';
import {
  Address,
  type AddressObject,
  ButtonListItem,
  FormattedList,
  type PatientData,
} from '../../..';
import { AddIcon } from '@*company-data-covered*/design-system';
import { Optional, ValueOf } from '@*company-data-covered*/shared/util/types';
import { MY_SETTINGS_LIST_TEST_IDS } from './testIds';
import {
  PatientMenuListItem,
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
} from '../PatientMenuListItem';

export type MySettingsData = PatientData & {
  billingAddress?: AddressObject;
};

export type MySettingsProps<HasPatientDetails extends true | false> =
  (HasPatientDetails extends true
    ? { settingsData: MySettingsData }
    : {
        settingsData: Optional<
          MySettingsData,
          | 'dateOfBirth'
          | 'assignedSexAtBirth'
          | 'genderIdentity'
          | 'billingAddress'
        >;
      }) & {
    hasRequestedCareForSelf?: boolean;
    onAddPatientDetails: HasPatientDetails extends true
      ? undefined
      : () => void;
    onSectionEdit: (
      sectionId: ValueOf<typeof PATIENT_MENU_LIST_ITEM_SECTIONS_IDS>
    ) => void;
    onSectionInfo: (
      sectionId: ValueOf<typeof PATIENT_MENU_LIST_ITEM_SECTIONS_IDS>
    ) => void;
    testIdPrefix: string;
    hasPatientDetails?: HasPatientDetails;
  };

type HasPatientDetails = boolean;

const MySettings: FC<MySettingsProps<HasPatientDetails>> = ({
  settingsData,
  hasPatientDetails,
  hasRequestedCareForSelf,
  onAddPatientDetails,
  onSectionEdit,
  onSectionInfo,
  testIdPrefix,
}) => {
  return (
    <FormattedList testIdPrefix={testIdPrefix}>
      <PatientMenuListItem
        editable={!hasRequestedCareForSelf}
        onEdit={onSectionEdit}
        onInfo={onSectionInfo}
        sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME}
        testIdPrefix={MY_SETTINGS_LIST_TEST_IDS.getNameListItemTestIdPrefix(
          testIdPrefix
        )}
        key={MY_SETTINGS_LIST_TEST_IDS.getNameListItemTestIdPrefix(
          testIdPrefix
        )}
      >
        {settingsData.firstName} {settingsData.lastName}
      </PatientMenuListItem>
      <PatientMenuListItem
        editable
        onEdit={onSectionEdit}
        sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.EMAIL}
        testIdPrefix={MY_SETTINGS_LIST_TEST_IDS.getEmailListItemTestIdPrefix(
          testIdPrefix
        )}
        key={MY_SETTINGS_LIST_TEST_IDS.getEmailListItemTestIdPrefix(
          testIdPrefix
        )}
      >
        {settingsData.email}
      </PatientMenuListItem>
      <PatientMenuListItem
        editable
        onEdit={onSectionEdit}
        sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.PHONE_NUMBER}
        testIdPrefix={MY_SETTINGS_LIST_TEST_IDS.getPhoneNumberListItemTestIdPrefix(
          testIdPrefix
        )}
        key={MY_SETTINGS_LIST_TEST_IDS.getPhoneNumberListItemTestIdPrefix(
          testIdPrefix
        )}
      >
        {settingsData.phoneNumber}
      </PatientMenuListItem>
      {hasPatientDetails ? (
        [
          <PatientMenuListItem
            editable={!hasRequestedCareForSelf}
            onEdit={onSectionEdit}
            onInfo={onSectionInfo}
            sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.DOB}
            testIdPrefix={MY_SETTINGS_LIST_TEST_IDS.getDOBListItemTestIdPrefix(
              testIdPrefix
            )}
            key={MY_SETTINGS_LIST_TEST_IDS.getDOBListItemTestIdPrefix(
              testIdPrefix
            )}
          >
            {settingsData.dateOfBirth}
          </PatientMenuListItem>,
          <PatientMenuListItem
            editable
            onEdit={onSectionEdit}
            sectionId={
              PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.ASSIGNED_SEX_AT_BIRTH
            }
            testIdPrefix={MY_SETTINGS_LIST_TEST_IDS.getAssignedSexAtBirthListItemTestIdPrefix(
              testIdPrefix
            )}
            key={MY_SETTINGS_LIST_TEST_IDS.getAssignedSexAtBirthListItemTestIdPrefix(
              testIdPrefix
            )}
          >
            {settingsData.assignedSexAtBirth}
          </PatientMenuListItem>,
          <PatientMenuListItem
            editable
            onEdit={onSectionEdit}
            sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.GENDER_IDENTITY}
            testIdPrefix={MY_SETTINGS_LIST_TEST_IDS.getGenderIdentityListItemTestIdPrefix(
              testIdPrefix
            )}
            key={MY_SETTINGS_LIST_TEST_IDS.getGenderIdentityListItemTestIdPrefix(
              testIdPrefix
            )}
          >
            {settingsData.genderIdentity}
          </PatientMenuListItem>,
          <PatientMenuListItem
            editable
            onEdit={onSectionEdit}
            sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.BILLING_ADDRESS}
            testIdPrefix={MY_SETTINGS_LIST_TEST_IDS.getBillingAddressListItemTestIdPrefix(
              testIdPrefix
            )}
            key={MY_SETTINGS_LIST_TEST_IDS.getBillingAddressListItemTestIdPrefix(
              testIdPrefix
            )}
          >
            {settingsData.billingAddress ? (
              <Address {...settingsData.billingAddress} />
            ) : null}
          </PatientMenuListItem>,
        ]
      ) : (
        <ButtonListItem
          color="primary"
          onClick={onAddPatientDetails}
          startIcon={<AddIcon />}
          size="large"
          testIdPrefix={testIdPrefix}
          variant="text"
        >
          Add patient details
        </ButtonListItem>
      )}
    </FormattedList>
  );
};

export default MySettings;
