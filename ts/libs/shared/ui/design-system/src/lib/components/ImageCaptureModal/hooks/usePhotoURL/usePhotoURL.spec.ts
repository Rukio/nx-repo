import { renderHook, act } from '../../../../../test-utils';
import usePhotoURL from './usePhotoURL';

const mockCreateObjectWebkitURL = jest.fn();

const mockRevokeObjectWebkitURL = jest.fn();

const mockCreateObjectURL = jest.fn();

const mockRevokeObjectURL = jest.fn();

describe('usePhotoURL', () => {
  describe.each([
    {
      description: 'using URL property',
      propertyToMock: URL,
      propertyToReset: 'webkitURL',
      createObjectURLMock: mockCreateObjectURL,
      revokeObjectURLMock: mockRevokeObjectURL,
      unusedCreateObjectURLMock: mockCreateObjectWebkitURL,
      unusedRevokeObjectURLMock: mockRevokeObjectWebkitURL,
    },
    {
      description: 'using webkitURL property',
      propertyToMock: webkitURL,
      propertyToReset: 'URL',
      createObjectURLMock: mockCreateObjectWebkitURL,
      revokeObjectURLMock: mockRevokeObjectWebkitURL,
      unusedCreateObjectURLMock: mockCreateObjectURL,
      unusedRevokeObjectURLMock: mockRevokeObjectURL,
    },
  ])(
    `$description`,
    ({
      propertyToMock,
      propertyToReset,
      createObjectURLMock,
      revokeObjectURLMock,
      unusedCreateObjectURLMock,
      unusedRevokeObjectURLMock,
    }) => {
      beforeAll(() => {
        jest.resetAllMocks();

        Object.defineProperty(propertyToMock, 'createObjectURL', {
          writable: true,
          value: createObjectURLMock,
        });

        Object.defineProperty(propertyToMock, 'revokeObjectURL', {
          writable: true,
          value: revokeObjectURLMock,
        });

        if (propertyToReset === 'URL') {
          Object.defineProperty(global, propertyToReset, {
            value: undefined,
          });
        }
      });

      it('should return correct data', () => {
        const { result, rerender, unmount } = renderHook(() => usePhotoURL());

        expect(createObjectURLMock).toHaveBeenCalledTimes(0);

        const { setPhoto } = result.current;

        act(() => {
          setPhoto(new Blob());
        });

        rerender();

        expect(createObjectURLMock).toHaveBeenCalledTimes(1);

        unmount();

        expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);

        expect(unusedCreateObjectURLMock).toHaveBeenCalledTimes(0);

        expect(unusedRevokeObjectURLMock).toHaveBeenCalledTimes(0);
      });
    }
  );
});
