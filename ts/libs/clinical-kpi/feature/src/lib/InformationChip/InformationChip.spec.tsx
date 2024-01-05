import { render, screen, fireEvent } from '../util/testUtils';
import InformationChip, {
  ChipActiveColor,
  ChipState,
  InformationChipProps,
} from './InformationChip';

const setup = (props: InformationChipProps) => {
  return render(<InformationChip {...props} />);
};

describe('InformationChip', () => {
  describe('tooltip with text should be visible on mouse over', () => {
    it.each([
      {
        chipState: ChipState.YES,
        activeColor: ChipActiveColor.RED,
        text: 'test information',
      },
      {
        chipState: ChipState.YES,
        activeColor: ChipActiveColor.GREEN,
        text: 'test information',
      },
    ])(
      'renders InformationChip component correctly with active state %p and color %p with information',
      async ({ chipState, activeColor, text }) => {
        const { container } = setup({ chipState, activeColor, text });
        const button = screen.getByRole('button');
        fireEvent.mouseOver(button);
        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent(text);
        expect(container).toMatchSnapshot();
      }
    );
  });

  describe('Chip should be visible and have correct value', () => {
    it.each([
      {
        chipState: ChipState.YES,
        activeColor: ChipActiveColor.RED,
      },
      {
        chipState: ChipState.YES,
        activeColor: ChipActiveColor.GREEN,
      },
      {
        chipState: ChipState.NO,
        activeColor: ChipActiveColor.RED,
      },
      {
        chipState: ChipState.NO,
        activeColor: ChipActiveColor.GREEN,
      },
    ])(
      'renders InformationChip component correctly with active state %p and color',
      ({ chipState, activeColor }) => {
        const { container } = setup({ chipState, activeColor });
        const chip = screen.getByTestId('information-chip');
        expect(chip).toBeVisible();
        expect(chip).toHaveTextContent(chipState);
        expect(container).toMatchSnapshot();
      }
    );
  });
});
