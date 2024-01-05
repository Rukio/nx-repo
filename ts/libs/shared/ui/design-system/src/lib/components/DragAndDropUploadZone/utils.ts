import { ErrorCode, FileRejection } from 'react-dropzone';

export const parseDragAndDropErrors = (
  rejectedFiles: FileRejection[],
  acceptedFileTypes?: { [key: string]: string[] }
): string => {
  const listOfAcceptedFileTypes = Object.values(acceptedFileTypes || {}).reduce(
    (acc, value) => [...acc, ...value],
    []
  );

  const invalidFileTypeMessage = listOfAcceptedFileTypes.length
    ? `Please upload with correct type. Accepted file types: ${listOfAcceptedFileTypes.join(
        ', '
      )}`
    : 'Please upload with correct type';

  const ERROR_MESSAGE_MAP: Partial<Record<ErrorCode | string, string>> = {
    'file-invalid-type': invalidFileTypeMessage,
    'file-too-large': 'File is too large please upload smaller',
    'too-many-files': 'Please upload only 1 file at a time.',
  };

  const rejectedFileError = rejectedFiles[0].errors[0];

  return (
    ERROR_MESSAGE_MAP[rejectedFileError?.code] || rejectedFileError?.message
  );
};
