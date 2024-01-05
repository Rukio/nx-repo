import { FC, ReactNode } from 'react';
import {
  Box,
  Typography,
  makeSxStyles,
  SxStylesValue,
} from '@*company-data-covered*/design-system';
import { FORM_HEADER_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    paddingTop: { paddingTop: 3 },
  });

export type FormHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  imageSrc?: string;
  imageSrcSet?: string;
  imageSizes?: string;
  imageAlt?: string;
  imageContainerSx?: SxStylesValue;
};

const FormHeader: FC<FormHeaderProps> = ({
  title,
  subtitle,
  imageSrc,
  imageSrcSet,
  imageSizes,
  imageAlt = 'Header Image',
  imageContainerSx = {},
}) => {
  const styles = makeStyles();

  return (
    <Box data-testid={FORM_HEADER_TEST_IDS.CONTAINER}>
      <Typography
        component="div"
        variant="h4"
        data-testid={FORM_HEADER_TEST_IDS.TITLE}
      >
        {title}
      </Typography>
      {imageSrc && (
        <Box sx={[styles.paddingTop, imageContainerSx]}>
          <img
            src={imageSrc}
            srcSet={imageSrcSet}
            sizes={imageSizes}
            alt={imageAlt}
            width="100%"
            data-testid={FORM_HEADER_TEST_IDS.IMAGE}
          />
        </Box>
      )}
      {subtitle && (
        <Typography
          sx={styles.paddingTop}
          variant="body1"
          data-testid={FORM_HEADER_TEST_IDS.SUBTITLE}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default FormHeader;
