export interface ImageLocation {
  /**
   * The URL at which the image can be located.
   *
   * @example 'https://qa.*company-data-covered*.com/license/medium/24/medium_1641850005-license.jpeg'
   */
  url: string | null;
}

export interface UploadedImageLocations {
  /**
   * The URL at which the image can be located.
   *
   * @example 'https://qa.*company-data-covered*.com/license/medium/24/medium_1641850005-license.jpeg'
   */
  url: string | null;

  /** The image location for the thumbnail sized image. */
  thumb: ImageLocation;

  /** The image location for the small sized image. */
  small: ImageLocation;

  /** The image location for the medium sized image. */
  medium?: ImageLocation;
}
