import { Form, Formik } from 'formik';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { useGetConfig } from '@*company-data-covered*/caremanager/data-access';
import { BackButton, PageContainer } from '@*company-data-covered*/caremanager/ui';
import TaskTemplateDetails from './components/TaskTemplateDetails';
import { CreateButton, SaveDeleteButton } from './Actions';
import TemplateDeleteConfirmation from './TemplateDeleteConfirmation';
import useTaskTemplates from './useTaskTemplates';
import {
  TaskTemplateTasks,
  composeTasks,
} from './components/TaskTemplateTasks';

const styles = makeSxStyles({
  headerContainer: {
    marginTop: 11,
    marginBottom: 4,
  },
  title: { flexGrow: 1 },
  tasksErrorAlert: { mt: 4 },
  formErrorAlert: { mt: 1 },
});

export const TaskTemplateForm: React.FC = () => {
  const { data: config } = useGetConfig();
  const {
    onCreateTemplate,
    onUpdateTemplate,
    validationSchema,
    initialValues,
    isLoading,
    isEdit,
    deleteConfirmationOpen,
    onDeleteConfirmationClose,
    onRemoveTemplate,
    onDeleteConfirmationOpen,
    tasks,
    setTasks,
    tasksError,
    formError,
  } = useTaskTemplates();

  if (isLoading) {
    return (
      <Box
        width="100%"
        height="500px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress size={100} />
      </Box>
    );
  }

  return (
    <PageContainer disableGutters maxWidth="xl">
      <TemplateDeleteConfirmation
        isOpen={deleteConfirmationOpen}
        onClose={onDeleteConfirmationClose}
        onSubmit={onRemoveTemplate}
      />
      <Container maxWidth="lg" sx={styles.headerContainer}>
        <Box
          className="headContainer"
          data-testid="create-task-templates-header"
        >
          <div className="headContainer--details">
            <BackButton testId="create-task-templates">Back</BackButton>
          </div>
          <Typography
            variant="h5"
            sx={styles.title}
            data-testid="create-task-templates-header-title"
          >
            {isEdit ? 'Edit' : 'New'} Task Template
          </Typography>
        </Box>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={() => {
            // noop
          }}
          validateOnMount
        >
          {({ values, isValid, resetForm }) => (
            <Form>
              <TaskTemplateDetails configData={config} />
              <TaskTemplateTasks tasks={tasks} setTasks={setTasks} />

              {tasksError && (
                <Alert
                  message="There should be at least one task added before creating the template."
                  severity="error"
                  sx={styles.tasksErrorAlert}
                  data-testid="submit-template-error-no-tasks"
                />
              )}

              {formError && (
                <Alert
                  message="Fill the required fields on Template Details before creating the template."
                  severity="error"
                  sx={styles.formErrorAlert}
                  data-testid="submit-template-error-missing-details"
                />
              )}

              {isEdit ? (
                <SaveDeleteButton
                  onDelete={onDeleteConfirmationOpen}
                  disabled={!isValid}
                  onSave={() => {
                    onUpdateTemplate(
                      {
                        ...values,
                        serviceLineId: values.serviceLineId || '',
                        tasks: composeTasks(tasks),
                      },
                      isValid,
                      resetForm
                    );
                  }}
                />
              ) : (
                <CreateButton
                  onSave={() =>
                    onCreateTemplate(
                      {
                        ...values,
                        serviceLineId: values.serviceLineId || '',
                        tasks: composeTasks(tasks),
                      },
                      isValid,
                      resetForm
                    )
                  }
                />
              )}
            </Form>
          )}
        </Formik>
      </Container>
    </PageContainer>
  );
};
