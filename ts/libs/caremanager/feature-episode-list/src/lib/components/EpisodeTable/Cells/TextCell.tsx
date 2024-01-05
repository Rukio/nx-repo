import { FC } from 'react';
import {
  SxStylesValue,
  TableCell,
  Typography,
} from '@*company-data-covered*/design-system';
import { abridgedText } from '@*company-data-covered*/caremanager/utils';

type Props = {
  text: string;
  testId: string;
  containerStyles: SxStylesValue;
};

const TextCell: FC<Props> = ({ text, testId, containerStyles }) => {
  const MAX_TEXT_LENGTH = 140;
  const EMPTY_TEXT_STRING = '_';

  return (
    <TableCell data-testid={testId} sx={containerStyles}>
      <Typography variant="body2" color="primary.contrast">
        {text.length > 0
          ? abridgedText(text, MAX_TEXT_LENGTH)
          : EMPTY_TEXT_STRING}
      </Typography>
    </TableCell>
  );
};

export default TextCell;
