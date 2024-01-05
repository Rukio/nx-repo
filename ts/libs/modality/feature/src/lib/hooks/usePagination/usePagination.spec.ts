import usePagination from './usePagination';

jest.mock('react', () => ({
  useMemo: jest.fn().mockImplementation((fn: () => void) => fn()),
}));

describe('usePagination', () => {
  it('should return correct data based on props', () => {
    const mockedArray = Array.from(Array(10)).map((_, index) => index);
    const firstPage = usePagination(mockedArray, 0, 10);
    expect(firstPage).toEqual(mockedArray.slice(0, 10));

    const per15Rows = usePagination(mockedArray, 0, 15);
    expect(per15Rows).toEqual(mockedArray);

    const nonExistingPage = usePagination(mockedArray, 1, 15);
    expect(nonExistingPage).toEqual([]);
  });

  it('should return an empty array if page or elementsToShow are invalid', () => {
    const mockedArray = Array.from(Array(10)).map((_, index) => index);

    const resultInvalidPage = usePagination(mockedArray, -1, 10);
    expect(resultInvalidPage).toEqual([]);

    const resultInvalidElementsPerPage = usePagination(mockedArray, -1, 10);
    expect(resultInvalidElementsPerPage).toEqual([]);
  });
});
