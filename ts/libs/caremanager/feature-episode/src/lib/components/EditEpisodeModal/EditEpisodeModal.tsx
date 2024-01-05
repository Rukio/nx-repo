import React from 'react';
import * as Yup from 'yup';
import { useField } from 'formik';
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  useCarePhaseOptions,
  useGetConfig,
  useUpdateEpisode,
} from '@*company-data-covered*/caremanager/data-access';
import { Episode } from '@*company-data-covered*/caremanager/data-access-types';
import { sortByName } from '@*company-data-covered*/caremanager/utils';
import {
  FormikDatePickerField,
  FormikModal,
  FormikSelectField,
} from '@*company-data-covered*/caremanager/ui';
import { TaskTemplateSearch } from '../TaskTemplateSearch';

export type EditEpisodeModalProps = {
  episode: Episode;
  isOpen: boolean;
  onClose: () => void;
};

export const validationSchema = Yup.object({
  marketId: Yup.string().required('Required'),
  carePhaseId: Yup.string().notOneOf(['0'], 'Required').required('Required'),
  admittedAt: Yup.date().required('Required'),
  applyTemplateIds: Yup.array(Yup.string().required())
    .notRequired()
    .nonNullable(),
  isWaiver: Yup.boolean().notRequired().nonNullable(),
});

export type EditEpisodeFormValues = Yup.InferType<typeof validationSchema>;

const CarePhaseSelect: React.FC = () => {
  const { carePhaseOptions } = useCarePhaseOptions<EditEpisodeFormValues>({
    includeClosed: true,
  });

  return (
    <FormikSelectField
      options={carePhaseOptions}
      name="carePhaseId"
      label="Care Phase"
      fullWidth
    />
  );
};

const styles = makeSxStyles({
  waiver: { marginTop: '6px;' },
  loading: {
    display: 'flex',
    position: 'fixed',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
const WaiverToggle: React.FC = () => {
  const [isWaiverField] = useField('isWaiver');

  return (
    <FormControlLabel
      control={
        <Switch
          defaultChecked={isWaiverField.value}
          name="isWaiver"
          onChange={isWaiverField.onChange}
          size="medium"
          data-testid="edit-episode-modal-is-waiver-toggle"
        />
      }
      label="Waiver"
      labelPlacement="start"
      sx={styles.waiver}
    />
  );
};

const EditEpisodeModal: React.FC<EditEpisodeModalProps> = ({
  episode,
  isOpen,
  onClose,
}) => {
  const { data, isLoading } = useGetConfig();
  const { mutate: updateEpisode } = useUpdateEpisode();

  const onSubmit = (values: EditEpisodeFormValues) => {
    const episodeUpdateValues = {
      ...values,
      patientSummary: episode.patientSummary,
    };
    updateEpisode({
      episodeId: episode.id,
      body: {
        ...episodeUpdateValues,
        admittedAt: values.admittedAt.toISOString(),
      },
    });
    onClose();
  };
  const initialValues = {
    admittedAt: new Date(episode.admittedAt),
    marketId: episode.market?.id || '',
    carePhaseId: episode.carePhase?.id || '',
    applyTemplateIds: episode.taskTemplates?.map((template) => template.id),
    isWaiver: episode.isWaiver,
  };

  return (
    <FormikModal
      title="Episode Details"
      isOpen={isOpen}
      onClose={onClose}
      testIdPrefix="edit-episode-modal"
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {isLoading ? (
        <Box sx={styles.loading}>
          <CircularProgress size={100} />
        </Box>
      ) : (
        <Stack
          direction="column"
          spacing={3}
          data-testid="edit-episode-modal-body"
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormikDatePickerField
                fieldData={{
                  name: 'admittedAt',
                  label: 'Admission Date',
                }}
                disableFuture
                dataTestId="edit-episode-modal-admitted-at"
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={5}
              data-testid="edit-episode-modal-market-select"
            >
              <FormikSelectField
                options={sortByName(data?.markets)}
                name="marketId"
                label="Market"
                fullWidth
              />
            </Grid>
            <Grid item xs={2} sm={3}>
              <WaiverToggle />
            </Grid>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Grid
              item
              sm={6}
              data-testid="edit-episode-modal-care-phase-select"
            >
              <CarePhaseSelect />
            </Grid>
          </Stack>
          <TaskTemplateSearch episodeTemplates={episode.taskTemplates} />
        </Stack>
      )}
    </FormikModal>
  );
};

export default EditEpisodeModal;
