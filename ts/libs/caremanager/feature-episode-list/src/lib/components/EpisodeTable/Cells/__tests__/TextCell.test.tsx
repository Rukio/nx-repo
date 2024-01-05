import { screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import TextCell from '../TextCell';

const setup = () => {
  const mockText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.';
  renderWithClient(
    <TextCell testId="text-cell-0" text={mockText} containerStyles={{}} />
  );
};

describe('generic text cell', () => {
  it('ends with ellipsis when too long', () => {
    setup();
    const textCell = screen.getByTestId('text-cell-0');
    const text = textCell.textContent || '';
    const finalChars = text.slice(-3, text.length);
    expect(finalChars).toMatch('...');
  });
});
