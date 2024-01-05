import { Route, Routes } from 'react-router-dom';
import RequestCareWidgetPreview from '../previews/RequestCareWidgetPreview';

export const App = () => {
  return (
    <Routes>
      <Route path="/request-care" element={<RequestCareWidgetPreview />} />
    </Routes>
  );
};

export default App;
