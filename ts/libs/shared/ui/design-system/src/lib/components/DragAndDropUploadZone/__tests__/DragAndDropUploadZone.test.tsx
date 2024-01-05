import { render, screen, fireEvent, waitFor } from '../../../../test-utils';
import { DRAG_AND_DROP_TEST_IDS as TEST_IDS } from '../testIds';

import DragAndDrop from '../index';

interface SetupProps {
  onDrop: (files: File[]) => void;
}

const MAX_FILE_SIZE_MB = 10;

const BYTES_IN_ONE_MB = 1048576;

const FileMaxSizeInBytes = MAX_FILE_SIZE_MB * BYTES_IN_ONE_MB;

const TEST_ID_PREFIX = 'test';

const ACCEPT = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

const setup = ({ onDrop }: SetupProps) => ({
  ...render(
    <DragAndDrop
      testIdPrefix={TEST_ID_PREFIX}
      onDrop={onDrop}
      dropzoneOptions={{
        accept: ACCEPT,
        maxSize: FileMaxSizeInBytes,
        maxFiles: 1,
      }}
    />
  ),
});

describe('<DragAndDropUploadZone />', () => {
  it('should correctly render', async () => {
    const onDrop = jest.fn();
    setup({
      onDrop,
    });

    expect(
      screen.getByTestId(TEST_IDS.getDragAndDropUploadZone(TEST_ID_PREFIX))
    ).toBeVisible();

    expect(
      screen.getByTestId(TEST_IDS.getDragAndDropUploadZoneText(TEST_ID_PREFIX))
    ).toHaveTextContent('Drag and drop files here or click to upload');

    const inputEl = screen.getByTestId(
      TEST_IDS.getDragAndDropZoneUploadInput(TEST_ID_PREFIX)
    );
    const file = new File(['file'], 'ping.png', {
      type: 'application/json',
    });

    Object.defineProperty(inputEl, 'files', {
      value: [file],
    });

    fireEvent.drop(inputEl);

    await waitFor(() => {
      expect(onDrop).toHaveBeenCalledWith([file]);
    });
  });

  it('should accept files with .png format', async () => {
    const onDrop = jest.fn();
    setup({
      onDrop,
    });

    const inputEl = screen.getByTestId(
      TEST_IDS.getDragAndDropZoneUploadInput(TEST_ID_PREFIX)
    );
    const file = new File(['file'], 'ping.png', {
      type: 'image/png',
    });

    Object.defineProperty(inputEl, 'files', {
      value: [file],
    });

    fireEvent.drop(inputEl);

    await waitFor(() => {
      expect(onDrop).toHaveBeenCalledWith([file]);
    });

    expect(
      screen.queryByTestId(
        TEST_IDS.getDragAndDropZoneUploadErrorText(TEST_ID_PREFIX)
      )
    ).not.toBeInTheDocument();
  });

  it('should reject files with .json format', async () => {
    const onDrop = jest.fn();
    setup({
      onDrop,
    });

    const inputEl = screen.getByTestId(
      TEST_IDS.getDragAndDropZoneUploadInput(TEST_ID_PREFIX)
    );
    const file = new File(['file'], 'ping.json', {
      type: 'application/json',
    });

    Object.defineProperty(inputEl, 'files', {
      value: [file],
    });

    fireEvent.drop(inputEl);

    await waitFor(() => {
      expect(onDrop).toHaveBeenCalledWith([]);
    });

    expect(
      screen.getByTestId(
        TEST_IDS.getDragAndDropZoneUploadErrorText(TEST_ID_PREFIX)
      )
    ).toHaveTextContent(
      'Please upload with correct type. Accepted file types: .png, .jpg, .jpeg'
    );
  });
});
