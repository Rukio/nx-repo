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
import type { StationCareRequest } from './StationCareRequest';
import {
    StationCareRequestFromJSON,
    StationCareRequestFromJSONTyped,
    StationCareRequestToJSON,
} from './StationCareRequest';
import type { StationPatient } from './StationPatient';
import {
    StationPatientFromJSON,
    StationPatientFromJSONTyped,
    StationPatientToJSON,
} from './StationPatient';

/**
 * 
 * @export
 * @interface GetServiceRequestResponse
 */
export interface GetServiceRequestResponse {
    /**
     * 
     * @type {ServiceRequest}
     * @memberof GetServiceRequestResponse
     */
    serviceRequest?: ServiceRequest;
    /**
     * 
     * @type {StationPatient}
     * @memberof GetServiceRequestResponse
     */
    stationPatient?: StationPatient;
    /**
     * 
     * @type {StationCareRequest}
     * @memberof GetServiceRequestResponse
     */
    stationCareRequest?: StationCareRequest;
}

/**
 * Check if a given object implements the GetServiceRequestResponse interface.
 */
export function instanceOfGetServiceRequestResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetServiceRequestResponseFromJSON(json: any): GetServiceRequestResponse {
    return GetServiceRequestResponseFromJSONTyped(json, false);
}

export function GetServiceRequestResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetServiceRequestResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'serviceRequest': !exists(json, 'service_request') ? undefined : ServiceRequestFromJSON(json['service_request']),
        'stationPatient': !exists(json, 'station_patient') ? undefined : StationPatientFromJSON(json['station_patient']),
        'stationCareRequest': !exists(json, 'station_care_request') ? undefined : StationCareRequestFromJSON(json['station_care_request']),
    };
}

export function GetServiceRequestResponseToJSON(value?: GetServiceRequestResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'service_request': ServiceRequestToJSON(value.serviceRequest),
        'station_patient': StationPatientToJSON(value.stationPatient),
        'station_care_request': StationCareRequestToJSON(value.stationCareRequest),
    };
}

