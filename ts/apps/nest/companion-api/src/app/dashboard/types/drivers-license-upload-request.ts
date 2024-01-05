export interface DriversLicenseUploadRequest {
  driver_license: {
    /**
     * The base64 encoded image.
     *
     * @example 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAA...'
     */
    license: string;

    /** The flag that indicates the ID does not need to be verified for Providers. */
    image_requires_verification: boolean;
  };
}
