import { render } from '@testing-library/react';

import RiskStratificationAdminFeature from './risk-stratification-admin-feature';

describe('RiskStratificationAdminFeature', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<RiskStratificationAdminFeature />);
    expect(baseElement).toBeTruthy();
  });
});
