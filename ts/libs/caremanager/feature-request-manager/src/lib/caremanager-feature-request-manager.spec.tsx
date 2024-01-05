import { render } from '@testing-library/react';

import { CaremanagerFeatureRequestManager } from './caremanager-feature-request-manager';

describe('CaremanagerFeatureRequestManager', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<CaremanagerFeatureRequestManager />);
    expect(baseElement).toBeTruthy();
  });
});
