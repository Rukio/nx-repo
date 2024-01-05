import {
  getAddressStatus,
  getPhoneNumber,
  pagedArray,
  unparsePhoneNumber,
} from '../utils';
import { PhoneNumber_PhoneNumberType } from '@*company-data-covered*/protos/nest/common/demographic';
import { AddressValidationStatus } from '@*company-data-covered*/protos/nest/patients/accounts/service';
import { AddressStatus } from '@*company-data-covered*/consumer-web-types';

describe('util tests', () => {
  describe('PagedArray: Slice array', () => {
    const offset = 2;
    const limit = 4;

    describe('should return with offset check', () => {
      it('should slice array correctly', () => {
        const testArray = [
          { id: 0, text: '0' },
          { id: 1, text: '1' },
          { id: 2, text: '2' },
          { id: 3, text: '3' },
        ];
        expect(pagedArray(testArray, limit, offset)).toEqual([
          { id: 2, text: '2' },
          { id: 3, text: '3' },
        ]);
      });

      it('should slice array correctly with negative limit', () => {
        const testArray = ['one', 'two', 'three'];
        expect(pagedArray(testArray, -30, offset)).toEqual([]);
      });

      it('should return empty array', () => {
        const testArray = [];
        expect(pagedArray(testArray, limit, offset)).toEqual([]);
      });

      it('should return an empty array due to exceeding the offset limit', () => {
        const testArray = [
          { id: 0, text: '0' },
          { id: 1, text: '1' },
        ];
        expect(pagedArray(testArray, limit, offset)).toEqual([]);
      });

      it('should return empty array due to a wrong offset', () => {
        const testArray = [
          { id: 0, text: '0' },
          { id: 1, text: '1' },
        ];
        expect(pagedArray(testArray, limit, -23)).toEqual([]);
      });

      it('should return empty array due to a wrong limit', () => {
        const testArray = [1, 2, 3, 4];
        expect(pagedArray(testArray, -20, offset)).toEqual([]);
      });
    });

    it('should check undefined input', () => {
      const testArray = undefined;
      expect(pagedArray(testArray, limit, offset)).toEqual([]);
    });
  });

  describe('unparsePhoneNumber', () => {
    it('should remove +1', () => {
      expect(unparsePhoneNumber('+1234567')).toEqual('234567');
    });

    it('should remain the same', () => {
      expect(unparsePhoneNumber('234567')).toEqual('234567');
    });

    it('should return empty', () => {
      expect(unparsePhoneNumber()).toEqual('');
    });
  });

  describe('getPhoneNumber', () => {
    it('should return valid US no', () => {
      expect(getPhoneNumber('+13035001518')).toEqual({
        phone_number_type:
          PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_UNSPECIFIED,
        phone_number: '3035001518',
        country_code: 1,
      });
    });

    it('should return undefined for invalid no', () => {
      expect(getPhoneNumber('invalid')).toEqual(undefined);
    });
  });

  describe('getAddressStatus', () => {
    it('should return invalid status', () => {
      expect(
        getAddressStatus(
          AddressValidationStatus.ADDRESS_VALIDATION_STATUS_INVALID
        )
      ).toEqual(AddressStatus.INVALID);
    });

    it('should return valid status', () => {
      expect(
        getAddressStatus(
          AddressValidationStatus.ADDRESS_VALIDATION_STATUS_VALID
        )
      ).toEqual(AddressStatus.VALID);
    });

    it('should return confirm status', () => {
      expect(
        getAddressStatus(
          AddressValidationStatus.ADDRESS_VALIDATION_STATUS_NEEDS_CONFIRMATION
        )
      ).toEqual(AddressStatus.CONFIRM);
    });

    it('should return unspecified status', () => {
      expect(
        getAddressStatus(
          AddressValidationStatus.ADDRESS_VALIDATION_STATUS_UNSPECIFIED
        )
      ).toEqual(AddressStatus.UNSPECIFIED);
    });
  });
});
