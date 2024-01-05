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
 * @interface CreateServiceRequestFromStationCRResponse
 */
export interface CreateServiceRequestFromStationCRResponse {
    /**
     * 
     * @type {ServiceRequest}
     * @memberof CreateServiceRequestFromStationCRResponse
     */
    serviceRequest?: ServiceRequest;
}

/**
 * Check if a given object implements the CreateServiceRequestFromStationCRResponse interface.
 */
export function instanceOfCreateServiceRequestFromStationCRResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function CreateServiceRequestFromStationCRResponseFromJSON(json: any): CreateServiceRequestFromStationCRResponse {
    return CreateServiceRequestFromStationCRResponseFromJSONTyped(json, false);
}

export function CreateServiceRequestFromStationCRResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateServiceRequestFromStationCRResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'serviceRequest': !exists(json, 'service_request') ? undefined : ServiceRequestFromJSON(json['service_request']),
    };
}

export function CreateServiceRequestFromStationCRResponseToJSON(value?: CreateServiceRequestFromStationCRResponse | null): any {
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
