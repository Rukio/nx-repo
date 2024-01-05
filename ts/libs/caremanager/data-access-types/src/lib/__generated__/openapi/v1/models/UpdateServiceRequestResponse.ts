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
 * @interface UpdateServiceRequestResponse
 */
export interface UpdateServiceRequestResponse {
    /**
     * 
     * @type {ServiceRequest}
     * @memberof UpdateServiceRequestResponse
     */
    serviceRequest?: ServiceRequest;
}

/**
 * Check if a given object implements the UpdateServiceRequestResponse interface.
 */
export function instanceOfUpdateServiceRequestResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpdateServiceRequestResponseFromJSON(json: any): UpdateServiceRequestResponse {
    return UpdateServiceRequestResponseFromJSONTyped(json, false);
}

export function UpdateServiceRequestResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdateServiceRequestResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'serviceRequest': !exists(json, 'service_request') ? undefined : ServiceRequestFromJSON(json['service_request']),
    };
}

export function UpdateServiceRequestResponseToJSON(value?: UpdateServiceRequestResponse | null): any {
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

