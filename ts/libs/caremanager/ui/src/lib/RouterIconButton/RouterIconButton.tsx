import { Link } from 'react-router-dom';
import { IconButton, makeSxStyles } from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  button: { padding: 0 },
});

type RouterIconButtonProps = {
  children: React.ReactElement;
  href: string;
};

export const RouterIconButton = ({ children, href }: RouterIconButtonProps) => {
  const buttonProps = {
    to: href,
    component: Link,
    onClick: undefined,
    sx: styles.button,
  };

  return <IconButton {...buttonProps}>{children}</IconButton>;
};
