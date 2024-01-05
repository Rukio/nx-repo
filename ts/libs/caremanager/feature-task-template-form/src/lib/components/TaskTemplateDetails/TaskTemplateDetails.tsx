import {
  Container,
  Grid,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  CareManagerServiceUpdateTaskTemplateRequest,
  CreateTaskTemplateRequest,
  GetConfigResponse,
} from '@*company-data-covered*/caremanager/data-access-types';
import {
  EMPTY_OPTION,
  useCarePhaseOptions,
} from '@*company-data-covered*/caremanager/data-access';
import {
  FormikInputField,
  FormikSelectField,
} from '@*company-data-covered*/caremanager/ui';

const styles = makeSxStyles({
  container: {
    bgcolor: 'background.paper',
    padding: '3rem 0',
    marginTop: 3,
  },
});

type TaskTemplateDetailsProps = {
  configData?: GetConfigResponse;
};

const TaskTemplateDetails: React.FC<TaskTemplateDetailsProps> = ({
  configData,
}) => {
  const { carePhaseOptions } = useCarePhaseOptions<
    CreateTaskTemplateRequest | CareManagerServiceUpdateTaskTemplateRequest
  >({ isRequired: false });

  return (
    <Container sx={styles.container}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography
            variant="h6"
            data-testid="create-task-template-details-header"
          >
            Template Details
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormikInputField
            fieldData={{
              label: 'Name (Required)',
              name: 'name',
            }}
            fullWidth
            data-testid="create-task-template-details-name-text-area"
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          data-testid="create-task-template-details-service-line-select"
        >
          <FormikSelectField
            options={[EMPTY_OPTION, ...(configData?.serviceLines ?? [])]}
            label="Service Line (Required)"
            name="serviceLineId"
            fullWidth
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          data-testid="create-task-template-details-care-phase-select"
        >
          <FormikSelectField
            options={carePhaseOptions}
            label="Care Phase"
            name="carePhaseId"
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <FormikInputField
            fieldData={{
              label: 'Summary',
              name: 'summary',
            }}
            fullWidth
            data-testid="create-task-template-details-summary-text-area"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default TaskTemplateDetails;
