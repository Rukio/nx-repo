import { sendMessageToParent, Message, MessageType } from './iframe';

window.parent.postMessage = vi.fn().mockReturnValue({});
export const mockWindowParentPostMessage = vi.mocked(window.parent.postMessage);

describe('iframe', () => {
  describe('sendMessageToParent', () => {
    it('should be called with correct type param and * target origin', () => {
      const mockMessage: Message = { type: MessageType.CloseModal };
      sendMessageToParent(mockMessage);
      expect(mockWindowParentPostMessage).toBeCalledWith(mockMessage, '*');
    });

    it('should be called with correct type, payload params and * target origin', () => {
      const mockMessage: Message = {
        type: MessageType.CloseModal,
        payload: {
          testString: 'test',
          testNumber: 1,
          empty: null,
        },
      };
      sendMessageToParent(mockMessage);
      expect(mockWindowParentPostMessage).toBeCalledWith(mockMessage, '*');
    });
  });
});
