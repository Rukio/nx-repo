import { Route, Routes } from 'react-router-dom';
import {
  CssBaseline,
  theme,
  ThemeProvider,
} from '@*company-data-covered*/design-system';
import RiskStratAdminHomepage from '../pages/Homepage';

export const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<RiskStratAdminHomepage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App;
