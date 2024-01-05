import { FC, ReactNode, useState } from 'react';
import { READ_MORE_TEST_IDS } from './testIds';
import { Box, Link } from '../..';

export type ReadMoreProps = {
  children?: string;
  expandLabel?: ReactNode | string;
  collapseLabel?: ReactNode | string;
  maxTextLength?: number;
};

const ReadMore: FC<ReadMoreProps> = ({
  children = '',
  expandLabel = 'read more',
  collapseLabel = 'read less',
  maxTextLength = 250,
}) => {
  const [showSlicedText, setShowSlicedText] = useState(true);

  const toggleShowSlicedText = () => {
    setShowSlicedText((prev) => !prev);
  };

  const showReadMoreButton = children.length >= maxTextLength;

  const text =
    showSlicedText && showReadMoreButton
      ? `${children?.slice(0, maxTextLength)}...`
      : `${children}`;

  const buttonLabel = showSlicedText ? expandLabel : collapseLabel;

  return (
    <>
      {text}
      {showReadMoreButton && (
        <Box ml={0.5} component="span">
          <Link
            onClick={toggleShowSlicedText}
            component="button"
            data-testid={READ_MORE_TEST_IDS.BUTTON}
            variant="body2"
          >
            {buttonLabel}
          </Link>
        </Box>
      )}
    </>
  );
};

export default ReadMore;
