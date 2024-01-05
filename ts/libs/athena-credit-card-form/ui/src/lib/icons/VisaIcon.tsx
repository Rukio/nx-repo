import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@*company-data-covered*/design-system';
import { ReactComponent as VisaLogo } from '../../assets/visa-logo.svg';

const VisaIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 60 40" {...props}>
    <VisaLogo />
  </SvgIcon>
);

export default VisaIcon;
