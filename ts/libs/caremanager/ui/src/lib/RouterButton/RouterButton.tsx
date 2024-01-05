import React from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonProps } from '@*company-data-covered*/design-system';

type RouterButtonProps = {
  title: string;
  href: string;
  testIdPrefix: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  color?: ButtonProps['color'];
  startIcon?: React.ReactNode;
};

export const RouterButton = ({
  title,
  href,
  testIdPrefix,
  size = 'medium',
  variant = 'text',
  color = 'secondary',
  startIcon = null,
}: RouterButtonProps) => {
  const buttonProps = {
    to: href,
    component: Link,
    onClick: undefined,
  };

  return (
    <Button
      size={size}
      variant={variant}
      color={color}
      data-testid={`${testIdPrefix}-router-button`}
      startIcon={startIcon}
      {...buttonProps}
    >
      {title}
    </Button>
  );
};
