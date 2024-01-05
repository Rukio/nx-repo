import { RouterButton } from '../RouterButton';

type TitleButtonProps = {
  title: string;
  href: string;
  testIdPrefix: string;
};

const TitleButton = ({ title, href, testIdPrefix }: TitleButtonProps) => (
  <RouterButton
    data-testid={`${testIdPrefix}-title-button`}
    href={href}
    title={title}
    testIdPrefix={testIdPrefix}
  />
);

export default TitleButton;
