import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@*company-data-covered*/design-system';
import { ReactComponent as DinersClubLogo } from '../../assets/diners-club-logo.svg';

const DinersClubIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 60 40" {...props}>
    <DinersClubLogo />
  </SvgIcon>
);

export default DinersClubIcon;
