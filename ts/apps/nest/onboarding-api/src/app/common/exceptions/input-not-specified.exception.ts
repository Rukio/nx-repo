export default class InputNotSpecifiedException extends Error {
  constructor(functionName: string) {
    super(`${functionName}: input is not specified`);
  }
}
