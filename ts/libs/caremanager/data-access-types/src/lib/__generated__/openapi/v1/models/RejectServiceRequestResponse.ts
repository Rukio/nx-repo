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
 * @interface RejectServiceRequestResponse
 */
export interface RejectServiceRequestResponse {
    /**
     * 
     * @type {ServiceRequest}
     * @memberof RejectServiceRequestResponse
     */
    serviceRequest?: ServiceRequest;
}

/**
 * Check if a given object implements the RejectServiceRequestResponse interface.
 */
export function instanceOfRejectServiceRequestResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function RejectServiceRequestResponseFromJSON(json: any): RejectServiceRequestResponse {
    return RejectServiceRequestResponseFromJSONTyped(json, false);
}

export function RejectServiceRequestResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): RejectServiceRequestResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'serviceRequest': !exists(json, 'service_request') ? undefined : ServiceRequestFromJSON(json['service_request']),
    };
}

export function RejectServiceRequestResponseToJSON(value?: RejectServiceRequestResponse | null): any {
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

