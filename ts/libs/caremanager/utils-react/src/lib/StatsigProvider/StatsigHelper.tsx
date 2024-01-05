import { useGate } from 'statsig-react';

const featureGates = {
  CAREMANAGER_MAINTENANCE_MODE: 'caremanager_maintenance_mode',
  CAREMANAGER_VISIT_SCHEDULING: 'caremanager_visit_scheduling',
  CAREMANAGER_SERVICE_REQUESTS: 'care_manager_service_requests',
  CAREMANAGER_VIRTUAL_APP: 'virtual_app_caremanager',
};

function useCheckGate(gate: string): boolean {
  return useGate(gate).value;
}

export function useFeatureFlagDisplayMaintenanceMode() {
  return useCheckGate(featureGates.CAREMANAGER_MAINTENANCE_MODE);
}

export function useFeatureFlagVisitScheduling() {
  return useCheckGate(featureGates.CAREMANAGER_VISIT_SCHEDULING);
}

export function useFeatureFlagServiceRequests() {
  return useCheckGate(featureGates.CAREMANAGER_SERVICE_REQUESTS);
}

export function useFeatureFlagVirtualApp() {
  return useCheckGate(featureGates.CAREMANAGER_VIRTUAL_APP);
}
