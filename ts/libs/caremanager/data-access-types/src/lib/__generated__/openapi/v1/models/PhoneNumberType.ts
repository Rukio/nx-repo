/* tslint:disable */
/* eslint-disable */
/**
 * caremanager/service.proto
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: version not set
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


/**
 * 
 * @export
 */
export const PhoneNumberType = {
    Unspecified: 'PHONE_NUMBER_TYPE_UNSPECIFIED',
    Home: 'PHONE_NUMBER_TYPE_HOME',
    Mobile: 'PHONE_NUMBER_TYPE_MOBILE',
    Work: 'PHONE_NUMBER_TYPE_WORK'
} as const;
export type PhoneNumberType = typeof PhoneNumberType[keyof typeof PhoneNumberType];


export function PhoneNumberTypeFromJSON(json: any): PhoneNumberType {
    return PhoneNumberTypeFromJSONTyped(json, false);
}

export function PhoneNumberTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): PhoneNumberType {
    return json as PhoneNumberType;
}

export function PhoneNumberTypeToJSON(value?: PhoneNumberType | null): any {
    return value as any;
}

