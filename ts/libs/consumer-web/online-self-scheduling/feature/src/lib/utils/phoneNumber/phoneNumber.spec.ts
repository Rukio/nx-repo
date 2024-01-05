import { formatPhoneNumber } from '.';

describe('formatPhoneNumber', () => {
  it.each([
    { input: '123-456-7890', expectedOutput: '123-456-7890' },
    { input: '11134567890', expectedOutput: '113-456-7890' },
    { input: '(123) 456 7890', expectedOutput: '123-456-7890' },
    { input: 'invalid123', expectedOutput: 'invalid123' },
    { input: '', expectedOutput: '' },
  ])('should format $input to $expectedOutput', ({ input, expectedOutput }) => {
    const formattedNumber = formatPhoneNumber(input);
    expect(formattedNumber).toEqual(expectedOutput);
  });
});
