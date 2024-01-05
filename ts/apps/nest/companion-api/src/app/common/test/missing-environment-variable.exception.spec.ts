import { MissingEnvironmentVariableException } from '../exceptions/missing-environment-variable.exception';

describe(`${MissingEnvironmentVariableException.name}`, () => {
  test('Is instanceof error', async () => {
    const exception = new MissingEnvironmentVariableException('fake env');

    expect(exception).toBeInstanceOf(Error);
  });

  test('Contains correct message', async () => {
    const exception = new MissingEnvironmentVariableException('fake env');

    expect(exception.message).toContain(
      'Missing required environment variable:'
    );
  });
});
