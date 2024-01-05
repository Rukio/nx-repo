import { ImageLocation } from './upload-image-location';

export interface DriversLicense {
  /**
   * The URL at which the image can be located.
   *
   * @example 'https://qa.*company-data-covered*.com/license/medium/24/medium_1641850005-license.jpeg'
   */
  url: string;

  /** The image location for the thumbnail sized image. */
  thumb: ImageLocation;

  /** The image location for the small sized image. */
  small: ImageLocation;

  /** The image location for the medium sized image. */
  medium: ImageLocation;
}

export interface DashboardDriversLicense {
  /** The ID of the driver's license upload. */
  id: number;

  /** The ID of the patient. */
  patient_id: number;

  /** The license model for the uploaded image. */
  license: DriversLicense;

  /**
   * The timestamp the model was created.
   *
   * @example '2022-01-10T21:26:45.522Z'
   */
  created_at: string;

  /**
   * The timestamp the model was last updated.
   *
   * @example '2022-01-10T21:26:45.522Z'
   */
  updated_at: string;
}
