import {
  Avatar,
  Chip,
  Grid,
  makeSxStyles,
  Typography,
} from '@*company-data-covered*/design-system';

export type CareTeamProps = {
  carName: string;
  avatarImageLink?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status?: string;
};

const styles = makeSxStyles({
  careTeam: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  typographyCarName: {
    marginBottom: 1,
    marginTop: 0.5,
  },
  avatarContainer: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0px',
    marginTop: 0.5,
  },
  sectionText: {
    color: (theme) => theme.palette.text.secondary,
  },
  insuranceVerificationChip: (theme) => ({
    backgroundColor: theme.palette.common.white,
    border: 1,
    borderColor: theme.palette.success.main,
    color: theme.palette.success.main,
  }),
});

export const CareTeam = ({
  carName,
  firstName,
  lastName,
  phoneNumber,
  avatarImageLink = '',
  status,
}: CareTeamProps) => {
  return (
    <>
      <Grid sx={styles.careTeam}>
        <Typography variant="subtitle2" sx={styles.typographyCarName}>
          {carName}
        </Typography>
        {status && (
          <Chip
            label={status}
            sx={styles.insuranceVerificationChip}
            size="small"
          />
        )}
      </Grid>
      <Grid container sx={styles.avatarContainer} mb={1}>
        <Grid item>
          <Avatar src={avatarImageLink} />
        </Grid>
        <Grid ml={2} item>
          <Typography variant="subtitle2" mt={0.5}>
            {firstName} {lastName}
          </Typography>
          <Typography variant="body2" sx={styles.sectionText}>
            CRN {phoneNumber}
          </Typography>
        </Grid>
      </Grid>
    </>
  );
};
