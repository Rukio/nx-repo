export enum ServiceName {
  DATADOG_LOGS = 'Datadog Logs',
  DATADOG_RUM = 'Datadog Rum',
}

export const generateServiceInitFailMessage = (serviceName: string) => {
  return `${serviceName} wasn't properly initialized because of error: `;
};

export const generateFuncFailMessage = (
  serviceName: string,
  funcName: string
) => {
  return `${serviceName}: ${funcName} failed: `;
};
