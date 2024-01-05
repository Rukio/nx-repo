import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@*company-data-covered*/design-system';
import { ReactComponent as AmericanExpressLogo } from '../../assets/american-express-logo.svg';

const AmericanExpressIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 60 40" {...props}>
    <AmericanExpressLogo />
  </SvgIcon>
);

export default AmericanExpressIcon;
