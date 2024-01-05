import * as React from 'react';
import { getLocalStorageItem, setLocalStorageItem } from './localStorage';

const localStorageMock = (() => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const INITIAL_VALUE = 'NEW VALUE';
const MOCK_STORAGE_KEY = 'TEST_KEY';
const NEW_VALUE = 'NEW VALUE';

jest.spyOn(React, 'useState').mockImplementation(() => ['', jest.fn()]);

describe('localStorage', () => {
  it('should get initial value', async () => {
    const expectedValue = getLocalStorageItem('', INITIAL_VALUE);

    expect(expectedValue).toEqual(INITIAL_VALUE);
  });

  it('should set/get value to/from local storage', async () => {
    setLocalStorageItem(MOCK_STORAGE_KEY, NEW_VALUE);

    const expectedValue = getLocalStorageItem(MOCK_STORAGE_KEY, '');

    expect(expectedValue).toEqual(NEW_VALUE);
  });
});
