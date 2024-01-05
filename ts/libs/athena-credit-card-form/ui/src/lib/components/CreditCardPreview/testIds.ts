const cardTypeIconPrefix = 'credit-card-preview-card-type-icon';

export const CREDIT_CARD_PREVIEW_TEST_IDS = {
  CONTAINER: 'credit-card-preview-container',
  CARD_TYPE_ICON_PREFIX: cardTypeIconPrefix,
  getCardTypeIconTestId: (cardType: string) =>
    `${cardTypeIconPrefix}-${cardType}`,
  CARD_TYPE_AND_NUMBER: 'credit-card-preview-card-type-and-number',
  EXPIRATION: 'credit-card-preview-expiration',
  DELETE_BUTTON: 'credit-card-preview-delete-button',
  CANCEL_BUTTON: 'credit-card-preview-cancel-button',
  CONFIRM_DELETE_BUTTON: 'credit-card-preview-confirm-delete-button',
};
