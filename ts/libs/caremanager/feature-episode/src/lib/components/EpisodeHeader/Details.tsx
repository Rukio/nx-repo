import React from 'react';
import {
  Box,
  Chip,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  boxStyling: {
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    alignItems: { xs: 'flex-start', sm: 'center' },
    padding: { xs: '0 8px', sm: '0' },
  },
  ageText: {
    display: { xs: 'inline', sm: 'none' },
    color: (theme) => theme.palette.text.secondary,
    marginLeft: '10px',
  },
  typographyStyle: {
    margin: { xs: '0 5px', sm: '0 10px' },
  },
  patientContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  descriptionContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  idText: {
    margin: { xs: '0 5px 0 0', sm: '0 10px' },
  },
});

type Props = {
  patient: string;
  id: string;
  gender: string;
  age: number;
  lengthOfStay: number;
  carePhase: string;
  serviceLine: string;
  isWaiver: boolean;
  athenaMedicalRecordNumber?: string;
};

const Details: React.FC<Props> = ({
  patient,
  id,
  age,
  lengthOfStay,
  gender,
  serviceLine,
  carePhase,
  athenaMedicalRecordNumber,
  isWaiver,
}) => (
  <Box sx={styles.boxStyling} data-testid="episode-details-section">
    <Box sx={styles.patientContainer}>
      <Typography variant="h6" data-testid="patient-details-name">
        {patient}
      </Typography>
      <Typography sx={styles.ageText} variant="body2">
        {age}yo {gender}
      </Typography>
    </Box>
    <Box sx={styles.descriptionContainer}>
      <Typography
        sx={styles.idText}
        variant="body2"
        data-testid={`athena-label-${id}`}
      >
        MRN {athenaMedicalRecordNumber}
      </Typography>
      ·
      <Typography
        sx={styles.typographyStyle}
        variant="body2"
        data-testid={`patient-care-line-label-${id}`}
      >
        {serviceLine}, {carePhase}
      </Typography>
      ·
      <Typography
        sx={styles.typographyStyle}
        variant="body2"
        data-testid={`length-of-care-label-${id}`}
      >
        LOS {lengthOfStay} d
      </Typography>
      {isWaiver && (
        <Chip
          label="Waiver"
          size="small"
          color="info"
          data-testid="episode-waiver-chip"
        />
      )}
    </Box>
  </Box>
);

export default Details;
