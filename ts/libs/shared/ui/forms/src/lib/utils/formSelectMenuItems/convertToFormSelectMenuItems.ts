import { FormMenuItem } from '../../types';

/**
 * An utility function to convert an object to MenuItem option
 *
 * @example
 * ```typescript
 * const states: State[] = [
 *   { id: '1', name: 'Colorado' },
 *   { id: '2', name: 'Texas' },
 * ];
 *
 * const formMenuItems: FormMenuItem[] = convertToFormSelectMenuItems(states, 'id', 'name');
 * ```
 *
 * @example
 * ```typescript
 *
 * const users: User[] = [
 *   { id: 1, firstName: 'John', lastName: 'Doe' },
 *   { id: 2, firstName: 'Michael', lastName: 'Jordan' },
 * ];
 *
 * const formMenuItems: FormMenuItem[] = convertToFormSelectMenuItems(users, 'id', (user) => user.firstName + user.lastName);
 * ```
 *
 * @param data - an array of objects to convert from
 * @param valueKeyOrTransformer - a value property key in object or transformer function
 * @param labelKeyOrTransformer - a label property key in object or transformer function
 * @returns an array of FormMenuItem objects
 */
export function convertToFormSelectMenuItems<
  T extends object,
  V extends keyof T,
  L extends keyof T,
  D extends T & { [x in V | L]: string | number }
>(
  data: D[],
  valueKeyOrTransformer: keyof T | ((data: D) => string | number),
  labelKeyOrTransformer: keyof T | ((data: D) => string | number)
): FormMenuItem[] {
  return data.map((fields: D) => ({
    value:
      typeof valueKeyOrTransformer === 'function'
        ? valueKeyOrTransformer(fields).toString()
        : fields[valueKeyOrTransformer].toString(),
    label:
      typeof labelKeyOrTransformer === 'function'
        ? labelKeyOrTransformer(fields).toString()
        : fields[labelKeyOrTransformer].toString(),
  }));
}
