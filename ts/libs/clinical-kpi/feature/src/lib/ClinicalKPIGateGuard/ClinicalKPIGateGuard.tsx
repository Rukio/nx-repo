import { FC, ReactNode } from 'react';
import { StatsigGateGuard } from '@*company-data-covered*/statsig/feature';
import { AlertButton } from '@*company-data-covered*/clinical-kpi/ui';
import { AppBar } from '../AppBar';
import {
  CLINICAL_KPI_FEATURE_GATE_ERROR_TEXT,
  CLINICAL_KPI_FEATURE_GATE_NAME,
} from './constants';

export interface ClinicalKPIGateGuardProps {
  children: ReactNode;
  stationURL: string;
}

export const ClinicalKPIGateGuard: FC<ClinicalKPIGateGuardProps> = ({
  children,
  stationURL,
}) => (
  <StatsigGateGuard
    gateName={CLINICAL_KPI_FEATURE_GATE_NAME}
    errorComponent={
      <>
        <AppBar stationURL={stationURL} />
        <AlertButton
          text={CLINICAL_KPI_FEATURE_GATE_ERROR_TEXT}
          buttonLink={stationURL}
          buttonText="Continue to Dashboard"
        />
      </>
    }
  >
    {children}
  </StatsigGateGuard>
);
