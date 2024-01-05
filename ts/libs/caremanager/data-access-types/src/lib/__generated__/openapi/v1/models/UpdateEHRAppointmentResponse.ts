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

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface UpdateEHRAppointmentResponse
 */
export interface UpdateEHRAppointmentResponse {
    /**
     * ID of created appointment for the specified visit.
     * @type {string}
     * @memberof UpdateEHRAppointmentResponse
     */
    appointmentId?: string;
}

/**
 * Check if a given object implements the UpdateEHRAppointmentResponse interface.
 */
export function instanceOfUpdateEHRAppointmentResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpdateEHRAppointmentResponseFromJSON(json: any): UpdateEHRAppointmentResponse {
    return UpdateEHRAppointmentResponseFromJSONTyped(json, false);
}

export function UpdateEHRAppointmentResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdateEHRAppointmentResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'appointmentId': !exists(json, 'appointment_id') ? undefined : json['appointment_id'],
    };
}

export function UpdateEHRAppointmentResponseToJSON(value?: UpdateEHRAppointmentResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'appointment_id': value.appointmentId,
    };
}
