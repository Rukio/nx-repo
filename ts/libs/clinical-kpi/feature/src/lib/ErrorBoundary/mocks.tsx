import { FC } from 'react';

export const FAKE_COMPONENTS_TEST_IDS = {
  GOOD_CHILD: 'good-child',
};

export const GOOD_CHILD_TEXT = 'GoodChild';

export const GoodChild: FC = () => (
  <div data-testid={FAKE_COMPONENTS_TEST_IDS.GOOD_CHILD}>{GOOD_CHILD_TEXT}</div>
);

export const BadChild: FC = () => {
  throw new Error('BadChild');
};
