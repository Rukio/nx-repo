export type DataDogPrivacyAttributes = {
  'data-dd-privacy'?: DatadogPrivacyOption;
};

export enum DatadogPrivacyOption {
  Allow = 'allow',
  Mask = 'mask',
  Hidden = 'hidden',
  MaskUserInput = 'mask-user-input',
}

export const getDataDogPrivacyHTMLAttributes = (
  option: DatadogPrivacyOption = DatadogPrivacyOption.Mask
) => ({
  'data-dd-privacy': option,
});
