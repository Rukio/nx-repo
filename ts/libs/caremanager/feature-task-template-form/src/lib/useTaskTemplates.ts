import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { isEmpty, reject } from 'rambda';
import {
  useCreateTaskTemplate,
  useDeleteTaskTemplate,
  useGetTaskTemplate,
  useUpdateTaskTemplate,
} from '@*company-data-covered*/caremanager/data-access';
import {
  CareManagerServiceCreateTaskTemplateRequest,
  CreateTemplateTask,
  TaskTemplate,
  TaskTypeEnum,
  UpdateTaskTemplateTask,
} from '@*company-data-covered*/caremanager/data-access-types';
import { TaskWithOperation, mapTask } from './components/TaskTemplateTasks';

const initialValues = {
  name: '',
  summary: '',
  serviceLineId: '',
  carePhaseId: '',
};

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  serviceLineId: Yup.string().required('Service Line is required'),
  carePhaseId: Yup.string(),
  summary: Yup.string(),
});

type EditTaskTemplateFormValues = Yup.InferType<typeof validationSchema> & {
  tasks?: CreateTemplateTask[] | UpdateTaskTemplateTask[];
};

export const toTaskTemplateDetail = ({
  id,
  name,
  summary,
  serviceLine,
  serviceLineId,
  carePhase,
}: TaskTemplate) => ({
  id,
  name,
  summary: summary ?? '',
  serviceLineId: serviceLineId ?? serviceLine?.id,
  carePhaseId: carePhase?.id,
});

const useTaskTemplates = () => {
  const { id } = useParams<{ id: string }>();
  const templateId = id || '';
  const navigate = useNavigate();
  const { mutate: createTaskTemplate } = useCreateTaskTemplate();
  const { mutate: deleteTaskTemplate } = useDeleteTaskTemplate();
  const { mutate: updateTaskTemplate } = useUpdateTaskTemplate();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const isEdit = !!templateId;
  const [tasks, setTasks] = useState<Record<string, TaskWithOperation[]>>({});
  const [tasksError, setTasksError] = useState(false);
  const [formError, setFormError] = useState(false);

  const goToTemplates = useCallback(
    () => navigate(`/settings/task-templates`),
    [navigate]
  );

  const { data: template, isLoading } = useGetTaskTemplate(templateId, isEdit);

  useEffect(() => {
    const existingTasks: Record<string, TaskWithOperation[]> = {};
    template?.taskTemplate?.tasks?.forEach((task) => {
      const typeSlug = task.type?.slug;
      if (!typeSlug) {
        return;
      }
      const mappedTask = mapTask(task.body, typeSlug as TaskTypeEnum, task.id);
      if (typeSlug in existingTasks) {
        existingTasks[typeSlug].push(mappedTask);
      } else {
        existingTasks[typeSlug] = [mappedTask];
      }
    });
    if (Object.entries(existingTasks).length) {
      setTasks(existingTasks);
    }
  }, [template]);

  const onCreateTemplate = useCallback(
    (
      values: EditTaskTemplateFormValues,
      isValid: boolean,
      resetForm: () => void
    ) => {
      setTasksError(!values.tasks);
      setFormError(!isValid);

      if (isValid && values.tasks) {
        createTaskTemplate(
          {
            body: {
              ...(reject(
                isEmpty,
                values
              ) as unknown as CareManagerServiceCreateTaskTemplateRequest['body']),
              summary: values.summary || '',
              tasks: values.tasks as CreateTemplateTask[],
            },
          },
          {
            onSuccess: () => {
              resetForm();
              goToTemplates();
            },
          }
        );
      }
    },
    [createTaskTemplate, goToTemplates]
  );

  const onUpdateTemplate = useCallback(
    (
      values: EditTaskTemplateFormValues,
      isValid: boolean,
      resetForm: () => void
    ) => {
      if (!isValid) {
        return;
      }
      updateTaskTemplate(
        {
          templateId,
          body: {
            ...reject(isEmpty, values),
            tasks: values.tasks || [],
          },
        },
        {
          onSuccess: () => {
            resetForm();
            goToTemplates();
          },
        }
      );
    },
    [updateTaskTemplate, templateId, goToTemplates]
  );

  const onDeleteConfirmationClose = useCallback(() => {
    setDeleteConfirmationOpen(false);
  }, []);

  const onRemoveTemplate = useCallback(() => {
    deleteTaskTemplate(
      { templateId },
      {
        onSuccess: () => {
          onDeleteConfirmationClose();
          goToTemplates();
        },
      }
    );
  }, [
    deleteTaskTemplate,
    templateId,
    onDeleteConfirmationClose,
    goToTemplates,
  ]);

  const onDeleteConfirmationOpen = useCallback(() => {
    setDeleteConfirmationOpen(true);
  }, []);

  return useMemo(
    () => ({
      onCreateTemplate,
      onUpdateTemplate,
      validationSchema,
      initialValues:
        isEdit && template?.taskTemplate
          ? toTaskTemplateDetail(template.taskTemplate)
          : initialValues,
      isEdit,
      isLoading,
      deleteConfirmationOpen,
      onDeleteConfirmationClose,
      onRemoveTemplate,
      onDeleteConfirmationOpen,
      tasks,
      setTasks,
      tasksError,
      formError,
    }),
    [
      onCreateTemplate,
      isEdit,
      isLoading,
      template,
      onUpdateTemplate,
      deleteConfirmationOpen,
      onDeleteConfirmationClose,
      onRemoveTemplate,
      onDeleteConfirmationOpen,
      tasks,
      setTasks,
      tasksError,
      formError,
    ]
  );
};

export default useTaskTemplates;
