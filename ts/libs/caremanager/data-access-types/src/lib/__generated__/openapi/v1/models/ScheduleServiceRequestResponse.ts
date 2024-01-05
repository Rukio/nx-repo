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
import type { ServiceRequest } from './ServiceRequest';
import {
    ServiceRequestFromJSON,
    ServiceRequestFromJSONTyped,
    ServiceRequestToJSON,
} from './ServiceRequest';

/**
 * 
 * @export
 * @interface ScheduleServiceRequestResponse
 */
export interface ScheduleServiceRequestResponse {
    /**
     * 
     * @type {ServiceRequest}
     * @memberof ScheduleServiceRequestResponse
     */
    serviceRequest?: ServiceRequest;
}

/**
 * Check if a given object implements the ScheduleServiceRequestResponse interface.
 */
export function instanceOfScheduleServiceRequestResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ScheduleServiceRequestResponseFromJSON(json: any): ScheduleServiceRequestResponse {
    return ScheduleServiceRequestResponseFromJSONTyped(json, false);
}

export function ScheduleServiceRequestResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ScheduleServiceRequestResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'serviceRequest': !exists(json, 'service_request') ? undefined : ServiceRequestFromJSON(json['service_request']),
    };
}

export function ScheduleServiceRequestResponseToJSON(value?: ScheduleServiceRequestResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'service_request': ServiceRequestToJSON(value.serviceRequest),
    };
}
