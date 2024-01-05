import { ReactNode } from 'react';
import MuiAlert, { AlertProps as MuiAlertProps } from '@mui/material/Alert';
import { AlertTitle } from '../..';

export interface AlertProps extends MuiAlertProps {
  title?: string;
  message: ReactNode | string;
}

const Alert = ({ title, message, ...rest }: AlertProps) => (
  <MuiAlert {...rest}>
    {!!title && <AlertTitle>{title}</AlertTitle>}
    {message}
  </MuiAlert>
);

export default Alert;
