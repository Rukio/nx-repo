import { render } from '@testing-library/react';
import RequestCareWidgetPreview from './RequestCareWidgetPreview';

describe('RequestCareWidgetPreview', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<RequestCareWidgetPreview />);

    expect(baseElement).toBeTruthy();
  });
});
