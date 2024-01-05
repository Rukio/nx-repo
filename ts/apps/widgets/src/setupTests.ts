import { mocked } from 'jest-mock';

console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

export const mockConsoleLog = mocked(console.log);
export const mockConsoleError = mocked(console.error);
export const mockConsoleWarn = mocked(console.warn);
