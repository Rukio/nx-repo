import {
  AddCircleIcon,
  AddIcon,
  Box,
  Toolbar,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { RouterButton } from '../RouterButton';
import { RouterIconButton } from '../RouterIconButton';

const styles = makeSxStyles({
  titleWrapper: { flexGrow: 1 },
});

type SectionHeaderProps = {
  sectionName: string;
  href?: string;
  buttonText?: string;
};

export const SectionHeader = ({
  sectionName,
  href,
  buttonText,
}: SectionHeaderProps) => (
  <Toolbar
    disableGutters
    data-testid={`${sectionName.toLowerCase()}-section-header`}
  >
    <Box sx={styles.titleWrapper}>
      <Typography
        variant="h5"
        data-testid={`${sectionName.toLowerCase()}-title`}
      >
        {sectionName}
      </Typography>
    </Box>
    {buttonText && href && (
      <Box display={{ xs: 'none', sm: 'flex' }}>
        <RouterButton
          title={buttonText}
          color="primary"
          variant="contained"
          href={href}
          testIdPrefix={`add-${sectionName.toLowerCase()}`}
          startIcon={<AddIcon />}
        />
      </Box>
    )}
    {href && (
      <Box display={{ xs: 'flex', sm: 'none' }}>
        <RouterIconButton href={href}>
          <AddCircleIcon color="primary" fontSize="large" />
        </RouterIconButton>
      </Box>
    )}
  </Toolbar>
);
