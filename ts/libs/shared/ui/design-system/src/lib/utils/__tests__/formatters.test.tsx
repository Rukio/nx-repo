import { formatPhoneNumber } from '../formatters';

describe('formatters', () => {
  describe('formatPhoneNumber', () => {
    it('should correctly format a partial phone number', () => {
      expect(formatPhoneNumber('8082')).toEqual('(808) 2');
    });

    it('should correctly format a complete phone number', () => {
      expect(formatPhoneNumber('8085551212')).toEqual('(808) 555-1212');
    });

    it('should handle an empty string', () => {
      expect(formatPhoneNumber('')).toEqual('');
    });

    it('should do its best with an invalid phone number string', () => {
      expect(formatPhoneNumber('(808)555-1212 7')).toEqual('80855512127');
    });
  });
});
