import { AppBar, APP_BAR_TEST_IDS } from './AppBar';
import { Section, SECTION_TEST_IDS } from './Section';
import { PageSection, PAGE_SECTION_TEST_IDS } from './PageSection';
import {
  CreatePatientForm,
  CreatePatientFormFields,
  CREATE_PATIENT_FORM_TEST_IDS,
} from './CreatePatientForm';
import {
  CreateAddressForm,
  CREATE_ADDRESS_FORM_TEST_IDS,
} from './CreateAddressForm';
import { AddressForm, ADDRESS_FORM_TEST_IDS } from './AddressForm';
import { PatientDetails, PATIENT_DETAILS_TEST_IDS } from './PatientDetails';
import {
  SavedAddresses,
  SAVED_ADDRESSES_TEST_IDS,
  ADDRESSES_MOCKS,
} from './SavedAddresses';
import {
  FormattedList,
  FormattedListItem,
  FormattedListItemButton,
  type FormattedListItemButtonProps,
  FormattedListItemIconButton,
  type FormattedListItemIconButtonProps,
  type FormattedListItemProps,
  FORMATTED_LIST_TEST_IDS,
} from './FormattedList';
import { Address, ADDRESS_TEST_IDS } from './Address';
import { Modal, MODAL_TEST_IDS } from './Modal';
import { ResponsiveModal, RESPONSIVE_MODAL_TEST_IDS } from './ResponsiveModal';
import { Confirmation, CONFIRMATION_TEST_IDS } from './Confirmation';
import { Drawer, DRAWER_TEST_IDS } from './Drawer';
import { EditAddressForm, EDIT_ADDRESS_FORM_TEST_IDS } from './EditAddressForm';
import { Page, PAGE_TEST_IDS } from './Page';
import {
  ButtonListItem,
  ButtonListItemProps,
  EditableFormattedListItem,
  EditableFormattedListItemProps,
  InformableFormattedListItem,
  InformableFormattedListItemProps,
  SettingsListItem,
  SettingsListItemProps,
  SETTINGS_LIST_TEST_IDS,
} from './SettingsList';
import {
  MySettings,
  MY_SETTINGS_LIST_TEST_IDS,
} from '../../../../ui/src/lib/components/MySettings';

import {
  PatientMenuListItem,
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
} from './PatientMenuListItem';

export {
  Address,
  AppBar,
  ButtonListItem,
  type ButtonListItemProps,
  Section,
  Page,
  PageSection,
  CreatePatientForm,
  type CreatePatientFormFields,
  EditableFormattedListItem,
  type EditableFormattedListItemProps,
  FormattedList,
  FormattedListItem,
  FormattedListItemButton,
  type FormattedListItemButtonProps,
  FormattedListItemIconButton,
  type FormattedListItemIconButtonProps,
  type FormattedListItemProps,
  InformableFormattedListItem,
  type InformableFormattedListItemProps,
  SettingsListItem,
  type SettingsListItemProps,
  MySettings,
  PatientMenuListItem,
  PATIENT_MENU_LIST_ITEM_SECTIONS_IDS,
  CreateAddressForm,
  Confirmation,
  Modal,
  Drawer,
  ResponsiveModal,
  SavedAddresses,
  ADDRESSES_MOCKS,
  AddressForm,
  EditAddressForm,
  PatientDetails,
};
export const TEST_IDS = {
  APP_BAR: APP_BAR_TEST_IDS,
  SECTION: SECTION_TEST_IDS,
  PAGE_SECTION: PAGE_SECTION_TEST_IDS,
  PAGE: PAGE_TEST_IDS,
  CREATE_PATIENT_FORM: CREATE_PATIENT_FORM_TEST_IDS,
  CREATE_ADDRESS_FORM: CREATE_ADDRESS_FORM_TEST_IDS,
  ADDRESS_FORM: ADDRESS_FORM_TEST_IDS,
  ADDRESS: ADDRESS_TEST_IDS,
  MODAL: MODAL_TEST_IDS,
  DRAWER: DRAWER_TEST_IDS,
  RESPONSIVE_MODAL: RESPONSIVE_MODAL_TEST_IDS,
  FORMATTED_LIST: FORMATTED_LIST_TEST_IDS,
  SETTINGS_LIST: SETTINGS_LIST_TEST_IDS,
  MY_SETTINGS: MY_SETTINGS_LIST_TEST_IDS,
  CONFIRMATION: CONFIRMATION_TEST_IDS,
  SAVED_ADDRESSES: SAVED_ADDRESSES_TEST_IDS,
  EDIT_ADDRESS_FORM: EDIT_ADDRESS_FORM_TEST_IDS,
  PATIENT_DETAILS: PATIENT_DETAILS_TEST_IDS,
};
