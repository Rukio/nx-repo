import { TaskWithOperation } from '../TaskTemplateTasks/TaskTemplateTasks.utils';

export type TaskViewProps = {
  task: TaskWithOperation;
  isTemplate?: boolean;
  onToggleStatus: () => void;
};
