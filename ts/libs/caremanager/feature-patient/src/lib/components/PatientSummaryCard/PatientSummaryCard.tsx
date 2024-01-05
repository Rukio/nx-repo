import { FC } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Link,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { calculateAge, formattedDOB } from '@*company-data-covered*/caremanager/utils';
import {
  useGetPatient,
  useGetProviderTypes,
} from '@*company-data-covered*/caremanager/data-access';
import { DetailsCard, DetailsCardRow } from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  link: { textDecoration: 'none' },
  routerLink: { a: { textDecoration: 'none' } },
});

interface Props {
  patientId: string;
}

export const PatientSummaryCard: FC<Props> = ({ patientId }) => {
  const { isLoading: isPatientLoading, data: patientData } =
    useGetPatient(patientId);
  const [{ isLoading: providerTypesLoading, data: providerTypesData }] =
    useGetProviderTypes();

  if (isPatientLoading || !patientData || providerTypesLoading) {
    return <CircularProgress />;
  }

  const { patient, externalCareProviders } = patientData;
  const PCPType = providerTypesData?.providerTypes?.find(
    ({ name }) => name === 'PCP'
  );
  const externalCarePCP =
    PCPType &&
    externalCareProviders?.find(
      ({ providerTypeId }) => providerTypeId === PCPType.id
    );

  if (!patient) {
    return <Typography>No patient found</Typography>;
  }
  const mapsUrl = `https://www.google.com/maps/search/${externalCarePCP?.address}`;

  return (
    <DetailsCard variant="elevation" title="Patient Summary">
      <DetailsCardRow label="Name" appendDivider>
        {patient.firstName} {patient.lastName}
      </DetailsCardRow>
      <DetailsCardRow label="Athena ID" appendDivider>
        {patient.athenaId}
      </DetailsCardRow>
      <DetailsCardRow label="DOB" appendDivider>
        {`${formattedDOB(patient.dateOfBirth)} (${calculateAge(
          patient.dateOfBirth
        )}yo)`}
      </DetailsCardRow>
      <DetailsCardRow appendDivider label="Phone">
        {patient.phoneNumber}
      </DetailsCardRow>
      {externalCarePCP && (
        <>
          <Typography
            variant="subtitle2"
            color={(theme) => theme.palette.text.secondary}
            marginY={4}
          >
            PCP
          </Typography>
          <DetailsCardRow appendDivider label="Name">
            {externalCarePCP.name}
          </DetailsCardRow>
          {externalCarePCP.phoneNumber && (
            <DetailsCardRow appendDivider label="Phone">
              {externalCarePCP.phoneNumber}
            </DetailsCardRow>
          )}
          <DetailsCardRow appendDivider={!!externalCarePCP.address} label="Fax">
            {externalCarePCP.faxNumber}
          </DetailsCardRow>
          <DetailsCardRow label="Address">
            {externalCarePCP.address ? (
              <Link
                sx={styles.link}
                to={mapsUrl}
                target="_blank"
                rel="noreferrer"
                component={RouterLink}
              >
                {externalCarePCP.address}
              </Link>
            ) : (
              '-'
            )}
          </DetailsCardRow>
        </>
      )}
      <Divider sx={{ marginBottom: 4 }} />
      <Box sx={styles.routerLink}>
        <RouterLink to={`/patients/${patient.id}`}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            data-testid="full-patient-details-button"
          >
            Go To Full Patient Details
          </Button>
        </RouterLink>
      </Box>
    </DetailsCard>
  );
};
