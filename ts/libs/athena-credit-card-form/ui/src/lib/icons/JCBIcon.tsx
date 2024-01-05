import { FC } from 'react';
import { SvgIcon, SvgIconProps } from '@*company-data-covered*/design-system';
import { ReactComponent as JCBLogo } from '../../assets/jcb-logo.svg';

const JCBIcon: FC<SvgIconProps> = (props) => (
  <SvgIcon viewBox="0 0 60 40" {...props}>
    <JCBLogo />
  </SvgIcon>
);

export default JCBIcon;
