import { setLocalStorageItem, getLocalStorageItem } from './localStorage';

const INITIAL_VALUE = 'NEW VALUE';
const MOCK_STORAGE_KEY = 'TEST_KEY';
const NEW_VALUE = 'NEW VALUE';

describe('localStorage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get initial value', async () => {
    const expectedValue = getLocalStorageItem('', INITIAL_VALUE);

    expect(expectedValue).toEqual(INITIAL_VALUE);
  });

  it('should set/get value to/from local storage', async () => {
    setLocalStorageItem(MOCK_STORAGE_KEY, NEW_VALUE);

    const expectedValue = getLocalStorageItem(MOCK_STORAGE_KEY, '');

    expect(expectedValue).toEqual(NEW_VALUE);
  });

  it('should catch error and return the initial value when getting an item from localStorage', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('TEST ERROR');
    });

    expect(getLocalStorageItem(MOCK_STORAGE_KEY, INITIAL_VALUE)).toEqual(
      INITIAL_VALUE
    );
  });

  it('should catch error when setting an item to localStorage ', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('TEST ERROR');
    });
    console.error = jest.fn();

    setLocalStorageItem(MOCK_STORAGE_KEY, INITIAL_VALUE);
    expect(console.error).toHaveBeenCalledWith(
      `Value is not set to local storage due to Error: TEST ERROR`
    );
  });
});
