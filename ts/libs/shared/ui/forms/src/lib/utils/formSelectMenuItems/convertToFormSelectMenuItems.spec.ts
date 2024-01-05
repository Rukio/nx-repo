import { convertToFormSelectMenuItems } from './convertToFormSelectMenuItems';

type Option = { id: number; firstName: string; lastName: string };

const mockData: Option[] = [
  { id: 1, firstName: 'John', lastName: 'Doe' },
  { id: 2, firstName: 'Michael', lastName: 'Jordan' },
];

describe('convertToFormSelectMenuItems', () => {
  it.each([
    {
      name: 'should convert data to FormMenuItem array correctly',
      data: mockData,
      valueKey: 'id',
      labelKey: 'firstName',
      expected: [
        { value: '1', label: 'John' },
        { value: '2', label: 'Michael' },
      ],
    },
    {
      name: 'should convert empty data array correctly',
      data: [],
      valueKey: 'id',
      labelKey: 'firstName',
      expected: [],
    },
    {
      name: 'should convert data with non-string/number values correctly',
      data: mockData,
      valueKey: 'firstName',
      labelKey: 'id',
      expected: [
        { value: 'John', label: '1' },
        { value: 'Michael', label: '2' },
      ],
    },
    {
      name: 'should convert data with transformers correctly',
      data: mockData,
      valueKey: 'id',
      labelKey: (data: Option) => `${data.firstName} ${data.lastName}`,
      expected: [
        { value: '1', label: 'John Doe' },
        { value: '2', label: 'Michael Jordan' },
      ],
    },
  ])('$name', ({ data, valueKey, labelKey, expected }) => {
    const result = convertToFormSelectMenuItems(data, valueKey, labelKey);

    expect(result).toEqual(expected);
  });
});
