import { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import TaskTemplates from './components/TaskTemplates';

const SettingsRoutes: FC = () => (
  <Routes>
    <Route path="task-templates" element={<TaskTemplates />} />
  </Routes>
);

export default SettingsRoutes;
