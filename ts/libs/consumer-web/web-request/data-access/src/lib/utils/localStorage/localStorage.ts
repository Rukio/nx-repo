export const getLocalStorageItem = <T>(key: string, initialValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);

    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    return initialValue;
  }
};

export const setLocalStorageItem = <T>(key: string, value: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Value is not set to local storage due to ${error}`);
  }
};
