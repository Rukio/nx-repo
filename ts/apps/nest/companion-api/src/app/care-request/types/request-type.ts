export enum RequestType {
  PHONE = 'phone',
  WEB = 'web',
  WEB_MOBILE = 'web_mobile',
  /** Equivalent to mobile iOS */
  MOBILE = 'mobile',
  MOBILE_ANDROID = 'mobile_android',
}

export const WEB_REQUEST_TYPES: RequestType[] = [
  RequestType.WEB,
  RequestType.WEB_MOBILE,
];
export const MOBILE_REQUEST_TYPES: RequestType[] = [
  RequestType.MOBILE,
  RequestType.MOBILE_ANDROID,
];
