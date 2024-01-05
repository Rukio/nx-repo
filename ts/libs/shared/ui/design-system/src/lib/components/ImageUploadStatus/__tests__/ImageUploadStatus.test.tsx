import { render, screen } from '../../../../test-utils';
import { IMAGE_UPLOAD_STATUS_TEST_IDS } from '../testIds';

import ImageUploadStatus, {
  ImageUploadStatusState,
  ImageUploadStatusProps,
} from '../index';

const TEST_ID_PREFIX = 'test';

const sampleIdUrl = 'ca-2018-real-id-dl.jpeg';

const mockProps: ImageUploadStatusProps = {
  imageUrl: sampleIdUrl,
  testIdPrefix: TEST_ID_PREFIX,
  status: ImageUploadStatusState.NotStarted,
};

const setup = (props: Partial<ImageUploadStatusProps> = {}) => ({
  ...render(<ImageUploadStatus {...mockProps} {...props} />),
});

describe('<ImageUploadStatus />', () => {
  it('should correctly render image with not started status', () => {
    setup();

    expect(
      screen.getByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getImagePreviewTestId(TEST_ID_PREFIX)
      )
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getInProgressIndicatorTestId(
          TEST_ID_PREFIX
        )
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getCompleteIndicatorTestId(TEST_ID_PREFIX)
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getErrorIndicatorTestId(TEST_ID_PREFIX)
      )
    ).not.toBeInTheDocument();
  });

  it('should correctly render image with in progress indicator', () => {
    setup({
      status: ImageUploadStatusState.InProgress,
    });

    expect(
      screen.getByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getImagePreviewTestId(TEST_ID_PREFIX)
      )
    ).toBeVisible();

    expect(
      screen.getByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getInProgressIndicatorTestId(
          TEST_ID_PREFIX
        )
      )
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getCompleteIndicatorTestId(TEST_ID_PREFIX)
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getErrorIndicatorTestId(TEST_ID_PREFIX)
      )
    ).not.toBeInTheDocument();
  });

  it('should correctly render image with complete indicator', () => {
    setup({
      status: ImageUploadStatusState.Completed,
    });

    expect(
      screen.getByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getImagePreviewTestId(TEST_ID_PREFIX)
      )
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getCompleteIndicatorTestId(TEST_ID_PREFIX)
      )
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getInProgressIndicatorTestId(
          TEST_ID_PREFIX
        )
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getErrorIndicatorTestId(TEST_ID_PREFIX)
      )
    ).not.toBeInTheDocument();
  });

  it('should correctly render image with error indicator', () => {
    setup({
      status: ImageUploadStatusState.Error,
    });

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getErrorIndicatorTestId(TEST_ID_PREFIX)
      )
    ).toBeVisible();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getInProgressIndicatorTestId(
          TEST_ID_PREFIX
        )
      )
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(
        IMAGE_UPLOAD_STATUS_TEST_IDS.getCompleteIndicatorTestId(TEST_ID_PREFIX)
      )
    ).not.toBeInTheDocument();
  });
});
