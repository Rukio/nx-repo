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
export const UnableToScheduleReason = {
    Unspecified: 'UNABLE_TO_SCHEDULE_REASON_UNSPECIFIED',
    AdvancedCareUnavailable: 'UNABLE_TO_SCHEDULE_REASON_ADVANCED_CARE_UNAVAILABLE',
    VisitTimeSlotUnavailable: 'UNABLE_TO_SCHEDULE_REASON_VISIT_TIME_SLOT_UNAVAILABLE'
} as const;
export type UnableToScheduleReason = typeof UnableToScheduleReason[keyof typeof UnableToScheduleReason];


export function UnableToScheduleReasonFromJSON(json: any): UnableToScheduleReason {
    return UnableToScheduleReasonFromJSONTyped(json, false);
}

export function UnableToScheduleReasonFromJSONTyped(json: any, ignoreDiscriminator: boolean): UnableToScheduleReason {
    return json as UnableToScheduleReason;
}

export function UnableToScheduleReasonToJSON(value?: UnableToScheduleReason | null): any {
    return value as any;
}

