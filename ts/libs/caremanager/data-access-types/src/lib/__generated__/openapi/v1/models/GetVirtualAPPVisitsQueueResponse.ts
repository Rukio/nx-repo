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
import type { VirtualAPPVisit } from './VirtualAPPVisit';
import {
    VirtualAPPVisitFromJSON,
    VirtualAPPVisitFromJSONTyped,
    VirtualAPPVisitToJSON,
} from './VirtualAPPVisit';

/**
 * 
 * @export
 * @interface GetVirtualAPPVisitsQueueResponse
 */
export interface GetVirtualAPPVisitsQueueResponse {
    /**
     * scheduled is the list of Visits that are scheduled for solo DHMT shift
     * teams by Logistics.
     * @type {Array<VirtualAPPVisit>}
     * @memberof GetVirtualAPPVisitsQueueResponse
     */
    scheduled?: Array<VirtualAPPVisit>;
    /**
     * available is the list of Visits that can be assigned to the current Virtual
     * APP.
     * @type {Array<VirtualAPPVisit>}
     * @memberof GetVirtualAPPVisitsQueueResponse
     */
    available?: Array<VirtualAPPVisit>;
    /**
     * assigned is the list of Visits that are already assigned to the current
     * Virtual APP.
     * @type {Array<VirtualAPPVisit>}
     * @memberof GetVirtualAPPVisitsQueueResponse
     */
    assigned?: Array<VirtualAPPVisit>;
}

/**
 * Check if a given object implements the GetVirtualAPPVisitsQueueResponse interface.
 */
export function instanceOfGetVirtualAPPVisitsQueueResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetVirtualAPPVisitsQueueResponseFromJSON(json: any): GetVirtualAPPVisitsQueueResponse {
    return GetVirtualAPPVisitsQueueResponseFromJSONTyped(json, false);
}

export function GetVirtualAPPVisitsQueueResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetVirtualAPPVisitsQueueResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'scheduled': !exists(json, 'scheduled') ? undefined : ((json['scheduled'] as Array<any>).map(VirtualAPPVisitFromJSON)),
        'available': !exists(json, 'available') ? undefined : ((json['available'] as Array<any>).map(VirtualAPPVisitFromJSON)),
        'assigned': !exists(json, 'assigned') ? undefined : ((json['assigned'] as Array<any>).map(VirtualAPPVisitFromJSON)),
    };
}

export function GetVirtualAPPVisitsQueueResponseToJSON(value?: GetVirtualAPPVisitsQueueResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'scheduled': value.scheduled === undefined ? undefined : ((value.scheduled as Array<any>).map(VirtualAPPVisitToJSON)),
        'available': value.available === undefined ? undefined : ((value.available as Array<any>).map(VirtualAPPVisitToJSON)),
        'assigned': value.assigned === undefined ? undefined : ((value.assigned as Array<any>).map(VirtualAPPVisitToJSON)),
    };
}

