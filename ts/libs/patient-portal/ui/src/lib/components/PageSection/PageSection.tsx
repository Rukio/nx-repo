import { PropsWithChildren, FC } from 'react';
import {
  Button,
  makeSxStyles,
  KeyboardBackspaceIcon,
  Typography,
} from '@*company-data-covered*/design-system';
import { Link as ReactRouterLink } from 'react-router-dom';
import { PAGE_SECTION_TEST_IDS } from './testIds';
import { Section } from '../Section';

export type PageSectionProps = PropsWithChildren<{
  testIdPrefix: string;
  title?: string;
  subtitle?: string;
  backButtonOptions?: {
    text: string;
    link: string;
  };
}>;

type MakeStylesProps = {
  hasBackButton: boolean;
};

const makeStyles = ({ hasBackButton }: MakeStylesProps) =>
  makeSxStyles({
    sectionTitle: {
      mb: 3,
      mt: hasBackButton ? 4 : 0,
    },
  });

const PageSection: FC<PageSectionProps> = ({
  testIdPrefix,
  backButtonOptions,
  title,
  subtitle,
  children,
}) => {
  const hasBackButton = !!backButtonOptions;
  const styles = makeStyles({ hasBackButton });

  return (
    <Section testIdPrefix={testIdPrefix}>
      {hasBackButton && (
        <Button
          data-testid={PAGE_SECTION_TEST_IDS.getPageSectionBackButtonTestId(
            testIdPrefix
          )}
          component={ReactRouterLink}
          to={backButtonOptions.link}
          variant="text"
          startIcon={<KeyboardBackspaceIcon />}
        >
          {backButtonOptions.text}
        </Button>
      )}
      {!!title && (
        <Typography
          data-testid={PAGE_SECTION_TEST_IDS.getPageSectionTitleTestId(
            testIdPrefix
          )}
          variant="h5"
          sx={styles.sectionTitle}
        >
          {title}
        </Typography>
      )}
      {!!subtitle && (
        <Typography
          data-testid={PAGE_SECTION_TEST_IDS.getPageSectionSubtitleTestId(
            testIdPrefix
          )}
          variant="body2"
          color="text.secondary"
        >
          {subtitle}
        </Typography>
      )}
      {children}
    </Section>
  );
};

export default PageSection;
