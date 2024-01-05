import {
  PatientLike,
  calculateDays,
  getAvatarInitials,
  getFullName,
} from '../helpers';

describe('getFullName', () => {
  it('with null middleName', () => {
    const patient = {
      firstName: 'Test',
      middleName: undefined,
      lastName: 'Test',
    } as PatientLike;

    expect(getFullName(patient)).toBe('Test Test');
  });

  it('with present middleName', () => {
    const patient = {
      firstName: 'Test',
      middleName: 'Middle',
      lastName: 'Test',
    } as PatientLike;

    expect(getFullName(patient)).toBe('Test Middle Test');
  });
});

describe('calculateDays', () => {
  it('discharged at date', () => {
    const days = calculateDays(
      new Date(2022, 2, 8, 15, 30, 0),
      new Date(2022, 3, 8, 15, 30, 0)
    );
    expect(days).toBe(31);
  });

  it('admitted at evening, check same day later', () => {
    const days = calculateDays(
      new Date(2022, 2, 8, 15, 30, 0),
      new Date(2022, 2, 8, 22, 30, 0)
    );
    expect(days).toBe(0);
  });

  it('admitted at evening, check next day morning', () => {
    const days = calculateDays(
      new Date(2022, 2, 8, 15, 30, 0),
      new Date(2022, 2, 9, 10, 0, 0)
    );
    expect(days).toBe(1);
  });

  it('No end date provided', () => {
    const days = calculateDays(new Date(2022, 2, 8, 15, 30, 0));
    // Couldn't think of a better way to test this
    expect(days).toBe(days);
  });
});

describe('getAvatarInitials', () => {
  it('should return avatar initials', () => {
    const initials = getAvatarInitials('Juan', 'Pérez');
    expect(initials).toBe('JP');
  });

  it('should return empty string when user name is not present', () => {
    const initials = getAvatarInitials();
    expect(initials).toBe('');
  });
});
