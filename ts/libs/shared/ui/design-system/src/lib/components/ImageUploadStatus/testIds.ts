export const IMAGE_UPLOAD_STATUS_TEST_IDS = {
  getImagePreviewTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-image-upload-status-image-preview`,
  getInProgressIndicatorTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-image-upload-status-in-progress-indicator`,
  getCompleteIndicatorTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-image-upload-status-complete-indicator`,
  getErrorIndicatorTestId: (testIdPrefix: string) =>
    `${testIdPrefix}-image-upload-status-error-indicator`,
};
