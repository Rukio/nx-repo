import { useUpdateEpisode } from '@*company-data-covered*/caremanager/data-access';
import { Button, Stack, TextField } from '@*company-data-covered*/design-system';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

type EditSummaryProps = {
  episodeId: string;
  summary: string;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
};

type FormValues = {
  patientSummary: string;
};

const validationSchema = Yup.object({
  patientSummary: Yup.string().required('Required'),
});

const EditSummary = ({ episodeId, summary, setEditMode }: EditSummaryProps) => {
  const { mutate: updateEpisode } = useUpdateEpisode();
  const onSubmit = ({ patientSummary }: FormValues) => {
    updateEpisode(
      { episodeId, body: { patientSummary } },
      {
        onSuccess: () => {
          setEditMode(false);
        },
      }
    );
  };
  const onClose = () => {
    setEditMode(false);
  };
  const initialValues = {
    patientSummary: summary,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {(formik) => (
        <Form>
          <Stack spacing={1}>
            <TextField
              multiline
              value={formik.values.patientSummary}
              onChange={formik.handleChange}
              name="patientSummary"
              size="small"
              fullWidth
              data-testid="episode-summary-text-area"
            />
            <Stack spacing={1} justifyContent="right" direction="row">
              <Button
                size="small"
                onClick={onClose}
                data-testid="edit-summary-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="small"
                variant="contained"
                data-testid="edit-summary-save-button"
                disableElevation
                disabled={!!formik.errors.patientSummary}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Form>
      )}
    </Formik>
  );
};

export default EditSummary;
