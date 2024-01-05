import { FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Container,
  Grid,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  VISIT_VISIT_SUMMARY,
  useAnalytics,
} from '@*company-data-covered*/caremanager/utils-react';
import {
  useCreateVisitSummary,
  useGetEpisode,
  useGetPatient,
  useGetServiceLines,
  useGetVisit,
  useGetVisitTypes,
  useUpdateVisitSummary,
} from '@*company-data-covered*/caremanager/data-access';
import { BackButton, PageContainer } from '@*company-data-covered*/caremanager/ui';
import { NotFound } from '@*company-data-covered*/caremanager/feature-status-pages';
import { PatientSummaryCard } from '@*company-data-covered*/caremanager/feature-patient';
import { Header } from './components/Header';
import { VisitStatus } from './components/VisitStatus';
import { LatestVisits } from './components/LatestVisits';
import { Summary } from './components/Summary';

const styles = makeSxStyles({
  headerBox: {
    backgroundColor: (theme) => theme.palette.common.white,
    paddingY: 2,
  },
  body: {
    flexDirection: { xs: 'row', md: 'row-reverse' },
    paddingY: {
      xs: 3,
      md: 5,
    },
    paddingX: {
      xs: 2,
      md: 3,
    },
  },
});

export const VisitPage: FC = () => {
  const { visitId = '', episodeId = '' } = useParams();
  const { trackPageViewed } = useAnalytics();

  const { isLoading: isLoadingVisitTypes, data: visitTypesData } =
    useGetVisitTypes();
  const { isLoading: isLoadingVisit, data: visitData } = useGetVisit({
    visitId,
  });
  const { isLoading: isLoadingEpisode, data: episodeData } =
    useGetEpisode(episodeId);

  const { isLoading: isLoadingPatient, data: patientData } = useGetPatient(
    episodeData?.episode?.patientId || '',
    {
      enabled: !!episodeData?.episode?.patient?.id,
    }
  );

  useEffect(() => {
    // TODO(CO-1518): Add previous page as second argument
    trackPageViewed(VISIT_VISIT_SUMMARY);
  }, [trackPageViewed]);

  const [getServiceLine] = useGetServiceLines();
  const serviceLine = getServiceLine(episodeData?.episode?.serviceLineId);

  const { mutate: createVisitSummary } = useCreateVisitSummary();
  const { mutate: updateVisitSummary } = useUpdateVisitSummary();

  if (visitData && visitData.visit?.episodeId !== episodeId) {
    return <NotFound />;
  }

  let visitTypeName: string | undefined;
  let isCall: boolean | undefined;
  if (visitData && visitTypesData) {
    const foundVisitType = visitTypesData.visitTypes.find(
      (type) => type.id === visitData.visit?.typeId
    );
    visitTypeName = foundVisitType?.name;
    isCall = foundVisitType?.isCallType;
  }

  const isLoading =
    isLoadingVisit &&
    isLoadingEpisode &&
    isLoadingVisitTypes &&
    isLoadingPatient;

  return (
    <>
      {isLoading && (
        <Container maxWidth="xl">
          <Box paddingY={4}>
            <CircularProgress />
          </Box>
        </Container>
      )}
      {visitData?.visit && episodeData?.episode && patientData?.patient && (
        <>
          <Box sx={styles.headerBox}>
            <Container maxWidth="xl">
              <BackButton>Episode</BackButton>
              <Header
                visit={visitData.visit}
                episode={episodeData.episode}
                patient={patientData.patient}
                visitTypeName={visitTypeName}
                insurances={patientData.insurances}
                isCall={isCall}
              />
            </Container>
          </Box>
          <PageContainer disableGutters maxWidth="xl">
            <Grid container sx={styles.body} spacing={3}>
              <Grid item xs={12} md={5} lg={4}>
                <Box marginBottom={3}>
                  <VisitStatus
                    visit={visitData.visit}
                    timezone={episodeData.episode.market?.tzName}
                  />
                </Box>
                <PatientSummaryCard patientId={episodeData.episode.patientId} />
              </Grid>
              <Grid item xs={12} md={7} lg={8}>
                <Box marginBottom={3}>
                  <Summary
                    onSummaryAdded={(summary: string) => {
                      createVisitSummary({
                        visitId,
                        body: {
                          body: summary,
                        },
                      });
                    }}
                    onSummaryEdited={(summary: string) => {
                      updateVisitSummary({
                        visitId,
                        body: {
                          body: summary,
                        },
                      });
                    }}
                    summary={visitData.summary}
                    title="Visit Summary"
                  />
                </Box>
                <Box marginBottom={3}>
                  <Summary
                    readonly
                    summary={{
                      body: episodeData.episode.patientSummary,
                    }}
                    title="Clinical Summary"
                  />
                </Box>
                <LatestVisits
                  numberOfVisits={3}
                  visit={visitData.visit}
                  episodeId={episodeData.episode.id}
                  serviceLineName={serviceLine?.name}
                />
              </Grid>
            </Grid>
          </PageContainer>
        </>
      )}
    </>
  );
};
