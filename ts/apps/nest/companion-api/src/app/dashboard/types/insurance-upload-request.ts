export interface InsuranceUploadRequest {
  insurance: {
    /**
     * A base64 encoded image.
     *
     * @example 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAA...'
     */
    card_front?: string;

    /**
     * A base64 encoded image.
     *
     * @example 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAA...'
     */
    card_back?: string;

    /**
     * A flag indicating whether or not the images require provider verification.
     *
     * For images from Companion, this is always true.
     */
    image_requires_verification: true;
  };
}
