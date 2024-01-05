export const PAGE_LAYOUT_TEST_IDS = {
  MISSED_REQUIRED_FIELDS_TITLE: 'missed-required-fields-title',
  MISSED_REQUIRED_FIELDS_LIST: 'missed-required-fields-list',
  MISSED_REQUIRED_FIELDS_LIST_ITEM: 'missed-required-fields-list-item',
  DISPATCH_HEALTH_LOGO: 'dispatch-health-logo',
  REQUEST_PROGRESS_BAR: 'request-progress-bar',
  getBackLinkTestId: (text: string) =>
    `${text.toLowerCase().replace(/\s/g, '-')}-back-link`,
  EMERGENCY_INFO_HEADER: 'emergency-info-header',
  SUCCESS_MESSAGE_HEADER: 'success-message-header',
  SUBMIT_VISIT_BUTTON: 'submit-visit-button',
  EMERGENCY_INFO_FOOTER: 'emergency-info-footer',
  PP_TOC_HEADER: 'pp-toc-header',
  PRIVATE_POLICY_LINK: 'private-policy-link',
  TERMS_OF_SERVICE_LINK: 'terms-of-service-link',
  GRECAPTCHA_TEXT: 'grecaptcha-text',
};
