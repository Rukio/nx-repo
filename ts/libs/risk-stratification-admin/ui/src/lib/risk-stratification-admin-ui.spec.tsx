import { render } from '@testing-library/react';

import RiskStratificationAdminUi from './risk-stratification-admin-ui';

describe('RiskStratificationServiceUi', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<RiskStratificationAdminUi />);
    expect(baseElement).toBeTruthy();
  });
});
