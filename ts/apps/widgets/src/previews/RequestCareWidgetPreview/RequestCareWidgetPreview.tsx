import { useEffect } from 'react';
import * as RequestCareWidget from '../../entries/RequestCareWidgetEntry';

const rootElementId = 'request-care-widget-root';

const RequestCareWidgetPreview = () => {
  useEffect(() => {
    const widget = RequestCareWidget.init({
      elementSelector: `#${rootElementId}`,
    });
    widget.render();
  }, []);

  return <div id={rootElementId} />;
};

export default RequestCareWidgetPreview;
