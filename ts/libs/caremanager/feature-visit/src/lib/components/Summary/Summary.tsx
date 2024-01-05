import { FC, useState } from 'react';
import { Form, Formik, FormikValues } from 'formik';
import Linkify from 'linkify-react';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Container,
  EditIcon,
  Grid,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import {
  formattedDateWithTime,
  getFullName,
} from '@*company-data-covered*/caremanager/utils';
import { useGetUsers } from '@*company-data-covered*/caremanager/data-access';
import { FormikInputField, assets } from '@*company-data-covered*/caremanager/ui';

export const summaryTestIds = {
  BODY: 'summary-body',
  CONTENT: 'summary-content',
  CREATE_BOX: 'summary-create-box',
  CREATE_BUTTON: 'summary-create-button',
  CREATION_INFO: 'summary-creation-info',
  EDIT_BUTTON: 'summary-edit-button',
  EDIT_CANCEL_BUTTON: 'summary-edit-cancel-button',
  EDIT_SAVE_BUTTON: 'summary-edit-save-button',
  EDITION_INFO: 'summary-edition-info',
  EDIT_TEXT_AREA: 'summary-edit-text-area',
  TITLE: 'summary-title',
};

const styles = makeSxStyles({
  summaryText: { whiteSpace: 'pre-wrap' },
  summaryInput: { mb: 2 },
  footer: {
    marginRight: '4px',
  },
  summaryBox: {
    borderRadius: '6px',
    overflow: 'hidden',
  },
  summaryContainer: {
    bgcolor: 'background.paper',
    padding: 3,
    width: '100%',
    minWidth: '100%',
  },
});

export interface SummaryData {
  body: string;
  createdAt?: string;
  updatedAt?: string;
  createdByUserId?: string;
  updatedByUserId?: string;
}

interface SummaryTextProps {
  body: string;
  linkTarget?: string;
}

const SummaryText: React.FC<SummaryTextProps> = ({
  body,
  linkTarget = '_blank',
}) => {
  return (
    <Typography
      variant="body2"
      sx={styles.summaryText}
      data-testid={summaryTestIds.BODY}
    >
      <Linkify options={{ target: linkTarget }}>{body}</Linkify>
    </Typography>
  );
};

interface EmptySummaryProps {
  onStartEditing: () => void;
}

const EmptySummary: React.FC<EmptySummaryProps> = ({ onStartEditing }) => {
  return (
    <Box
      data-testid={summaryTestIds.CREATE_BOX}
      padding={3}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
    >
      <img alt="empty" src={assets.quill} />
      <Typography variant="body1" my={2} color="text.secondary">
        No Summary Added Yet
      </Typography>
      <Button
        color="primary"
        data-testid={summaryTestIds.CREATE_BUTTON}
        variant="contained"
        onClick={onStartEditing}
      >
        + Add Summary
      </Button>
    </Box>
  );
};

const validationSchema = Yup.object({
  body: Yup.string().required('Required'),
});

interface EditSummaryProps {
  body: string;
  onCancelEditing: () => void;
  onSubmit: (body: string) => void;
}

const EditSummary: React.FC<EditSummaryProps> = ({
  body = '',
  onSubmit,
  onCancelEditing,
}) => {
  const handleSubmit = (values: FormikValues) => {
    onSubmit(values.body);
  };

  const initialValues = {
    body,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Form>
          <Stack spacing={1}>
            <Box sx={styles.summaryInput}>
              <FormikInputField
                multiline
                fieldData={{
                  label: '',
                  name: 'body',
                }}
                fullWidth
                minRows={4}
                data-testid={summaryTestIds.EDIT_TEXT_AREA}
              />
            </Box>
            <Stack spacing={1} justifyContent="right" direction="row">
              <Button
                size="medium"
                onClick={onCancelEditing}
                data-testid={summaryTestIds.EDIT_CANCEL_BUTTON}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="medium"
                variant="contained"
                data-testid={summaryTestIds.EDIT_SAVE_BUTTON}
                disableElevation
                disabled={!!formik.errors.body}
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

interface SummaryFooterProps {
  summary: SummaryData;
}

const SummaryFooter: FC<SummaryFooterProps> = ({ summary }) => {
  const { createdAt, createdByUserId, updatedAt, updatedByUserId } = summary;

  const { data, isLoading } = useGetUsers(
    [createdByUserId, updatedByUserId].filter((id) => !!id) as string[]
  );

  if (isLoading || !data) {
    return null;
  }

  const createdBy = data.users.find((user) => user.id === createdByUserId);
  const updatedBy = data.users.find((user) => user.id === updatedByUserId);
  const dateForDisplay = updatedAt ?? createdAt;

  return (
    <Box width="100%" bgcolor="divider" py={1} px={3} display="flex">
      {createdBy && (
        <Typography
          variant="label"
          color="text.secondary"
          data-testid={summaryTestIds.CREATION_INFO}
          sx={styles.footer}
        >
          {getFullName(createdBy)}, {createdBy.jobTitle}{' '}
          {dateForDisplay && formattedDateWithTime(new Date(dateForDisplay))}
        </Typography>
      )}
      {updatedBy && (
        <Typography
          variant="label"
          color="text.secondary"
          data-testid={summaryTestIds.EDITION_INFO}
        >
          • edited by {getFullName(updatedBy)}
        </Typography>
      )}
    </Box>
  );
};

interface SummaryProps {
  onSummaryAdded?: (summary: string) => void;
  onSummaryEdited?: (summary: string) => void;
  readonly?: boolean;
  summary?: SummaryData;
  title?: string;
}

export const Summary: FC<SummaryProps> = ({
  onSummaryAdded,
  onSummaryEdited,
  readonly,
  summary,
  title = 'Summary',
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleStartEditing = () => {
    setIsEditing(true);
  };
  const handleCancelEditing = () => {
    setIsEditing(false);
  };
  const handleSubmitEdit = (body: string) => {
    setIsEditing(false);

    if (!summary) {
      onSummaryAdded?.(body);
    } else {
      onSummaryEdited?.(body);
    }
  };

  const content = (() => {
    if (readonly) {
      return <SummaryText body={summary?.body ?? ''} />;
    }

    if (!summary && !isEditing) {
      return <EmptySummary onStartEditing={handleStartEditing} />;
    }

    if (isEditing) {
      return (
        <EditSummary
          body={summary?.body ?? ''}
          onCancelEditing={handleCancelEditing}
          onSubmit={handleSubmitEdit}
        />
      );
    }

    return <SummaryText body={summary?.body ?? ''} />;
  })();

  const shouldShowFooter = summary?.createdAt && summary.createdByUserId;

  return (
    <Box data-testid={summaryTestIds.CONTENT} sx={styles.summaryBox}>
      <Container disableGutters sx={styles.summaryContainer}>
        <Stack spacing={2}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="h6" data-testid={summaryTestIds.TITLE}>
                {title}
              </Typography>
            </Grid>
            <Grid item>
              <Box height={36}>
                {!readonly && !isEditing && summary?.body && (
                  <Button
                    variant="text"
                    size="medium"
                    startIcon={<EditIcon />}
                    onClick={handleStartEditing}
                    data-testid={summaryTestIds.EDIT_BUTTON}
                  >
                    Edit
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
          {content}
        </Stack>
      </Container>
      {summary && shouldShowFooter && !isEditing && (
        <SummaryFooter summary={summary} />
      )}
    </Box>
  );
};
