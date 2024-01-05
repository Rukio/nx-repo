import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useGetPatient } from '@*company-data-covered*/caremanager/data-access';
import { getFullName } from '@*company-data-covered*/caremanager/utils';
import { BackButton, PageContainer } from '@*company-data-covered*/caremanager/ui';
import PatientDemographicsCard from './components/PatientDemographicsCard';
import PatientInsurancesCard from './components/PatientInsurancesCard';
import PatientContactCard from './components/PatientContactCard';
import PatientMedicalDecisionMakerCard from './components/PatientMedicalDecisionMakerCard';
import PatientPharmacyCard from './components/PatientPharmacyCard';
import PatientExternalCareTeam from './components/PatientExternalCareTeam';

export const PATIENT_DETAILS_HEADER_TEST_ID = 'patient-details-header';

const styles = makeSxStyles({
  headerContainer: (theme) => ({
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.grey.A100}`,
    paddingTop: 2,
  }),
  container: { marginTop: 3 },
});

export const PatientPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const { data } = useGetPatient(params.id ?? '');
  const patient = data?.patient;

  if (!patient) {
    return null;
  }

  return (
    <>
      <Box
        sx={styles.headerContainer}
        data-testid={PATIENT_DETAILS_HEADER_TEST_ID}
      >
        <Container>
          <BackButton>Episode</BackButton>
          <Box marginBottom={3}>
            <Typography variant="h5" data-testid="patient-page-full-name">
              {getFullName(patient)}
            </Typography>
          </Box>
        </Container>
      </Box>
      <PageContainer sx={styles.container}>
        <Grid direction="row-reverse" container spacing={2}>
          <Grid item xs={12} sm={5} md={4}>
            <PatientDemographicsCard patient={patient} />
            <PatientInsurancesCard
              patientId={patient.id}
              insurances={data.insurances ?? []}
            />
            <PatientContactCard patient={patient} />
            <PatientMedicalDecisionMakerCard
              patientId={patient.id}
              medicalDecisionMaker={data.medicalDecisionMakers?.[0]}
            />
          </Grid>
          <Grid item xs={12} sm>
            <PatientPharmacyCard
              patientId={patient.id}
              pharmacy={data.pharmacies?.[0]}
            />
            <PatientExternalCareTeam
              patientId={patient.id}
              externalCareProviders={data.externalCareProviders}
            />
          </Grid>
        </Grid>
      </PageContainer>
    </>
  );
};
