import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const startMockWorker = async (apiUrl: string, nodeEnv: string) => {
  if (nodeEnv === 'development' && apiUrl === window.location.origin) {
    const worker = setupWorker(...handlers);
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
};
