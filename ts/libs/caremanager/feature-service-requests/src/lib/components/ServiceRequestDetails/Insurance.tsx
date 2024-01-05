import { useUpdateServiceRequest } from '@*company-data-covered*/caremanager/data-access';
import {
  Box,
  FormControl,
  Stack,
  Switch,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { VerifiedChip } from '../VerifiedChip';
import { DataRow } from './DataRow';
import { CMSForm } from './CMSForm';

const styles = makeSxStyles({
  container: {
    padding: 2,
  },
  title: {
    marginRight: '8px',
  },
  column: {
    gap: '4px',
  },
  verificaitonContainer: {
    border: '1px solid',
    borderRadius: '4px',
  },
  verificationSection: {
    display: 'flex',
    padding: '4px 16px',
    alignItems: 'center',
  },
  verificationSectionVerified: (theme) => ({
    backgroundColor: `${theme.palette.success.main}0A`,
  }),
  verificationSectionNotVerified: (theme) => ({
    backgroundColor: `${theme.palette.warning.main}1E`,
  }),
  cmsContainer: {
    color: 'text.secondary',
  },
  cmsDescription: {
    padding: '4px 16px',
    backgroundColor: 'grey.50',
    borderBottom: '1px solid',
    borderBottomColor: 'divider',
  },
  cmsRow: {
    padding: '8px 16px',
  },
});

type Props = {
  serviceRequestId: string;
  payer?: string;
  network?: string;
  memberID?: string;
  cms?: string;
  isVerified?: boolean;
  'data-testid'?: string;
};

export const Insurance: React.FC<Props> = ({
  serviceRequestId,
  payer,
  network,
  memberID,
  cms,
  isVerified,
  'data-testid': testId,
}) => {
  const { mutateAsync: updateServiceRequest, isLoading } =
    useUpdateServiceRequest();

  const handleVerifiedChange = async (checked: boolean) => {
    await updateServiceRequest({
      serviceRequestId,
      body: { isInsuranceVerified: checked },
    });
  };

  const handleCMSSubmit = async (cmsNumber: string) => {
    await updateServiceRequest({
      serviceRequestId,
      body: { cmsNumber },
    });
  };

  return (
    <Stack spacing={2} sx={styles.container} data-testid={testId}>
      <Stack spacing={1} direction="row" sx={{ alignItems: 'baseline' }}>
        <Typography variant="h6" sx={styles.title}>
          Insurance
        </Typography>
        <VerifiedChip isVerified={isVerified} />
      </Stack>
      <Box sx={styles.column}>
        <DataRow label="Payer">{payer}</DataRow>
        <DataRow label="Network">{network}</DataRow>
        <DataRow label="Member ID">{memberID}</DataRow>
      </Box>
      <Box
        sx={{
          ...styles.verificaitonContainer,
          borderColor: isVerified ? 'success.main' : 'warning.main',
        }}
      >
        <Box
          sx={[
            styles.verificationSection,
            isVerified
              ? styles.verificationSectionVerified
              : styles.verificationSectionNotVerified,
          ]}
        >
          <Typography variant="body2" flex={1} id="insurance-verify-label">
            Mark Insurance as Verified
          </Typography>
          <FormControl>
            <Switch
              checked={isVerified}
              onChange={(_, checked) => handleVerifiedChange(checked)}
              inputProps={{
                role: 'checkbox',
                'aria-checked': isVerified,
                'aria-labelledby': 'insurance-verify-label',
              }}
            />
          </FormControl>
        </Box>
        {isVerified ? (
          <Box sx={styles.cmsContainer}>
            <Box sx={styles.cmsDescription}>
              <Typography variant="body2">
                Insert the CMS number below if available
              </Typography>
            </Box>
            <Box sx={styles.cmsRow}>
              <DataRow label="CMS">
                <CMSForm
                  cms={cms}
                  isVerified={isVerified}
                  isUpdating={isLoading}
                  onSubmit={handleCMSSubmit}
                />
              </DataRow>
            </Box>
          </Box>
        ) : null}
      </Box>
    </Stack>
  );
};
