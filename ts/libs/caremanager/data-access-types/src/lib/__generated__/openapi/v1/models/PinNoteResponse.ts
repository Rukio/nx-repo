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
import type { Note } from './Note';
import {
    NoteFromJSON,
    NoteFromJSONTyped,
    NoteToJSON,
} from './Note';

/**
 * 
 * @export
 * @interface PinNoteResponse
 */
export interface PinNoteResponse {
    /**
     * 
     * @type {Note}
     * @memberof PinNoteResponse
     */
    note?: Note;
}

/**
 * Check if a given object implements the PinNoteResponse interface.
 */
export function instanceOfPinNoteResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function PinNoteResponseFromJSON(json: any): PinNoteResponse {
    return PinNoteResponseFromJSONTyped(json, false);
}

export function PinNoteResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): PinNoteResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'note': !exists(json, 'note') ? undefined : NoteFromJSON(json['note']),
    };
}

export function PinNoteResponseToJSON(value?: PinNoteResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'note': NoteToJSON(value.note),
    };
}

