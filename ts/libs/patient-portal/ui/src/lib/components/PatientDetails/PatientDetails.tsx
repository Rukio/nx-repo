import { FC } from 'react';
import { FormattedList } from '../FormattedList';
import { PATIENT_DETAILS_TEST_IDS } from './testIds';
import {
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
  PatientMenuListItem,
} from '../PatientMenuListItem';
import { PatientData } from '../../types';
import { ButtonListItem } from '../SettingsList';
import { ValueOf } from '@*company-data-covered*/shared/util/types';

export type PatientDetailsProps = {
  patientDetails: PatientData;
  onSectionEdit: (
    sectionId: ValueOf<typeof PATIENT_MENU_LIST_ITEM_SECTIONS_IDS>
  ) => void;
  onSectionInfo: (
    sectionId: ValueOf<typeof PATIENT_MENU_LIST_ITEM_SECTIONS_IDS>
  ) => void;
  onRemovePatient: () => void;
};

const PatientDetails: FC<PatientDetailsProps> = ({
  patientDetails,
  onSectionEdit,
  onSectionInfo,
  onRemovePatient,
}) => (
  <FormattedList testIdPrefix={PATIENT_DETAILS_TEST_IDS.PREFIX}>
    <PatientMenuListItem
      editable={false}
      onEdit={onSectionEdit}
      onInfo={onSectionInfo}
      sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.NAME}
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.NAME}
    >
      {patientDetails.firstName} {patientDetails.lastName}
    </PatientMenuListItem>
    <PatientMenuListItem
      editable
      onEdit={onSectionEdit}
      onInfo={onSectionInfo}
      sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.EMAIL}
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.EMAIL}
    >
      {patientDetails?.email}
    </PatientMenuListItem>
    <PatientMenuListItem
      editable
      onEdit={onSectionEdit}
      onInfo={onSectionInfo}
      sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.PHONE_NUMBER}
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.PHONE_NUMBER}
    >
      {patientDetails?.phoneNumber}
    </PatientMenuListItem>
    <PatientMenuListItem
      editable={false}
      onEdit={onSectionEdit}
      onInfo={onSectionInfo}
      sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.DOB}
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.DOB}
    >
      {patientDetails?.dateOfBirth}
    </PatientMenuListItem>
    <PatientMenuListItem
      editable
      onEdit={onSectionEdit}
      onInfo={onSectionInfo}
      sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.LEGAL_SEX}
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.LEGAL_SEX}
    >
      {patientDetails?.legalSex}
    </PatientMenuListItem>
    <PatientMenuListItem
      editable
      onEdit={onSectionEdit}
      onInfo={onSectionInfo}
      sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.ASSIGNED_SEX_AT_BIRTH}
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.ASSIGNED_SEX_AT_BIRTH}
    >
      {patientDetails?.assignedSexAtBirth}
    </PatientMenuListItem>
    <PatientMenuListItem
      editable
      onEdit={onSectionEdit}
      onInfo={onSectionInfo}
      sectionId={PATIENT_MENU_LIST_ITEM_SECTIONS_IDS.GENDER_IDENTITY}
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.GENDER_IDENTITY}
    >
      {patientDetails?.genderIdentity}
    </PatientMenuListItem>
    <ButtonListItem
      onClick={onRemovePatient}
      color="error"
      size="large"
      testIdPrefix={PATIENT_DETAILS_TEST_IDS.REMOVE_PATIENT_BUTTON}
      variant="outlined"
      fullWidth
    >
      Remove this Patient
    </ButtonListItem>
  </FormattedList>
);

export default PatientDetails;
