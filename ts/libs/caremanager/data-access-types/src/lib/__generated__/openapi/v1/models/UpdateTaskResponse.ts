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
import type { Task } from './Task';
import {
    TaskFromJSON,
    TaskFromJSONTyped,
    TaskToJSON,
} from './Task';

/**
 * 
 * @export
 * @interface UpdateTaskResponse
 */
export interface UpdateTaskResponse {
    /**
     * 
     * @type {Task}
     * @memberof UpdateTaskResponse
     */
    task?: Task;
}

/**
 * Check if a given object implements the UpdateTaskResponse interface.
 */
export function instanceOfUpdateTaskResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpdateTaskResponseFromJSON(json: any): UpdateTaskResponse {
    return UpdateTaskResponseFromJSONTyped(json, false);
}

export function UpdateTaskResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdateTaskResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'task': !exists(json, 'task') ? undefined : TaskFromJSON(json['task']),
    };
}

export function UpdateTaskResponseToJSON(value?: UpdateTaskResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'task': TaskToJSON(value.task),
    };
}

