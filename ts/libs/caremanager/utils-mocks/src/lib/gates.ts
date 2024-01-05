export const mockedGates = new Map<string, unknown>();

export function updateMockedGates(key = '', value = false) {
  mockedGates.set(key, value);
}
