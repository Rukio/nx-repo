import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@*company-data-covered*/design-system';
import { ReactComponent as MastercardLogo } from '../../assets/mastercard-logo.svg';

const MastercardIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 30 18" {...props}>
    <MastercardLogo />
  </SvgIcon>
);

export default MastercardIcon;
