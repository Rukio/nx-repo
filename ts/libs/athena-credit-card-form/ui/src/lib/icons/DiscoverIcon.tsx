import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@*company-data-covered*/design-system';
import { ReactComponent as DiscoverLogo } from '../../assets/discover-logo.svg';

const DiscoverIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 60 40" {...props}>
    <DiscoverLogo />
  </SvgIcon>
);

export default DiscoverIcon;
