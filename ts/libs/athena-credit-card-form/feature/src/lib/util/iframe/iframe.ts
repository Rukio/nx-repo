import { environment } from '../../../environments/environment';

export enum MessageType {
  CloseModal = 'close-modal',
}

export type Message = {
  type: MessageType;
  payload?: Record<string, string | number | undefined | null>;
};

export const sendMessageToParent = (message: Message) => {
  const { targetOrigins } = environment;
  targetOrigins.forEach((targetOrigin) => {
    window.parent.postMessage(message, targetOrigin);
  });
};
