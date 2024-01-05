import ReadMore from '..';
import { render, screen, userEvent, waitFor } from '../../../../test-utils';
import { Basic } from '../__storybook__/ReadMore.stories';
import { READ_MORE_TEST_IDS } from '../testIds';

const containerDataTestId = 'container-test-id';

const mockText =
  'Dolore in irure eu eiusmod adipisicing id laboris culpa aliqua';

const setup = ({
  maxTextLength = 30,
  text = mockText,
}: { maxTextLength?: number; text?: string } = {}) => {
  return render(
    <div data-testid={containerDataTestId}>
      <ReadMore maxTextLength={maxTextLength}>{text}</ReadMore>
    </div>
  );
};

describe('ReadMore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('snapshots', () => {
    it('should render basic snapshot correctly', () => {
      const { asFragment } = render(<Basic />);
      expect(asFragment()).toMatchSnapshot();
    });
  });

  it('should render text with read more button if text length is more than max', async () => {
    setup();

    const readMoreButton = screen.getByTestId(READ_MORE_TEST_IDS.BUTTON);
    expect(readMoreButton).toBeVisible();
    expect(readMoreButton).toBeEnabled();
  });

  it('should render text without read more button if text length is less than max', async () => {
    setup({ maxTextLength: 100 });

    const readMoreButton = screen.queryByTestId(READ_MORE_TEST_IDS.BUTTON);
    expect(readMoreButton).not.toBeInTheDocument();
  });

  it('should render empty text without read more button if no children was passed', async () => {
    setup({ text: '' });

    const container = await screen.findByTestId(containerDataTestId);
    expect(container).toHaveTextContent('');

    const readMoreButton = screen.queryByTestId(READ_MORE_TEST_IDS.BUTTON);
    expect(readMoreButton).not.toBeInTheDocument();
  });

  it('should expand and collapse text on button click', async () => {
    const slicedText = mockText.slice(0, 30);

    setup();

    const container = await screen.findByTestId(containerDataTestId);
    expect(container).toHaveTextContent(slicedText);

    const readMoreButton = screen.getByTestId(READ_MORE_TEST_IDS.BUTTON);
    expect(readMoreButton).toBeVisible();
    expect(readMoreButton).toBeEnabled();

    await userEvent.click(readMoreButton);

    await waitFor(() => {
      expect(container).toHaveTextContent(mockText);
    });

    await userEvent.click(readMoreButton);

    await waitFor(() => {
      expect(container).toHaveTextContent(slicedText);
    });
  });
});
