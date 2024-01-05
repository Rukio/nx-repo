import { Box, BoxProps } from '../..';

export interface ImageProps extends BoxProps {
  src: string;
  alt?: string;
}

const Image = ({ src, alt, ...rest }: ImageProps) => (
  <Box {...rest}>
    <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '100%' }} />
  </Box>
);

export default Image;
