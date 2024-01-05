import { render } from '../../../../test-utils';

import *company-data-covered*Logo from '../index';

test('should render default size', () => {
  const { asFragment } = render(<*company-data-covered*Logo />);
  expect(asFragment()).toMatchSnapshot();
});

test('should render custom size', () => {
  const { asFragment } = render(<*company-data-covered*Logo pixelHeight={48} />);
  expect(asFragment()).toMatchSnapshot();
});
