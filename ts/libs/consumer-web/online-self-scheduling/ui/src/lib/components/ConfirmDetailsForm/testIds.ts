import { DetailsSection } from './ConfirmDetailsForm';

const formatValue = (value: string) => value.toLowerCase().replace(/\s/g, '-');

export const CONFIRM_DETAILS_FORM_TEST_IDS = {
  ROOT: 'confirm-details-form-root',
  getDetailsSection: (name: string) => `confirm-details-form-${name}-section`,
  getDetailsItemEditButton: (section: DetailsSection) =>
    `confirm-details-form-${formatValue(section)}-section-edit-button`,
  getDetailsItemLabel: (section: DetailsSection, label: string) =>
    `confirm-details-form-${formatValue(section)}-section-${formatValue(
      label
    )}-label`,
  getDetailsItemValue: (section: DetailsSection, value: string) =>
    `confirm-details-form-${formatValue(section)}-section-${formatValue(
      value
    )}-value`,
  CONFIRM_SECTION: 'confirm-details-form-confirm-section',
  CHECKBOX_CONTROL_LABEL: 'confirm-details-form-checkbox-control-label',
  CHECKBOX_INPUT: 'confirm-details-form-checkbox-input',
  LIST: 'confirm-details-form-list',
};
