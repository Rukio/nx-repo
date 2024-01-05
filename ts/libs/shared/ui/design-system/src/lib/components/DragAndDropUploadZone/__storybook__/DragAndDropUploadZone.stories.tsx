import { FC, useState } from 'react';
import { Meta } from '@storybook/react';
import { Grid } from '../../../index';
import DragAndDrop from '../index';

const FILE_MAX_FILE_SIZE_MB = 10;

const BYTES_IN_ONE_MB = 1048576;

const FileMaxSizeInBytes = FILE_MAX_FILE_SIZE_MB * BYTES_IN_ONE_MB;

export default {
  title: 'Drag and Drop Upload Zone',
  component: DragAndDrop,
} as Meta<typeof DragAndDrop>;

export const Basic: FC = (args) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDropHandler = (newFiles: File[]) => {
    setFiles((prevValues) => [...prevValues, ...newFiles]);
  };

  return (
    <>
      <DragAndDrop
        dropzoneOptions={{
          accept: {
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
          },
          maxSize: FileMaxSizeInBytes,
          maxFiles: 1,
        }}
        onDrop={onDropHandler}
        testIdPrefix="test"
        {...args}
      />
      {files?.length ? (
        <div>
          <h3>Files dropped</h3>
          <Grid container direction="column">
            {files.map((file) => (
              <span>{file.name}</span>
            ))}
          </Grid>
        </div>
      ) : null}
    </>
  );
};
