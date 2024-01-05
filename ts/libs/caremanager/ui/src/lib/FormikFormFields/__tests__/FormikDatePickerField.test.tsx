import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import {
  formattedDate,
  getParsedDate,
} from '@*company-data-covered*/caremanager/utils';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { FormikDatePickerField } from '../FormikDatePickerField';

const setup = (date: Date) => {
  const fieldData = {
    name: 'date',
    label: 'Date',
  };

  renderWithClient(
    <Formik
      initialValues={{ date: date.toISOString() }}
      validationSchema={Yup.date()}
      onSubmit={vi.fn()}
    >
      <Form>
        <FormikDatePickerField dataTestId="test" fieldData={fieldData} />,
      </Form>
    </Formik>
  );
};

describe('MUI FormikDatePickerField', () => {
  beforeAll(() => {
    // this is necessary for the date picker to be rendered in desktop mode.
    // if this is not provided, the mobile mode is rendered, which might lead to unexpected behavior
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        media: query,
        // media query that @MUI/pickers uses to determine if a device is a desktop device
        matches: query === '(pointer: fine)',
        onchange: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: () => false,
      }),
    });
  });

  it('should render correctly', () => {
    const todayDate = new Date();
    const today = new Date(
      todayDate.getTime() - todayDate.getTimezoneOffset() * 60 * 1000
    );
    setup(today);
    expect(screen.getByTestId('test-date')).toBeInTheDocument();
  });

  it('datepicker value should be passed the date', () => {
    const todayDate = new Date();
    setup(todayDate);
    const datePicker = screen.getByTestId('test-date');
    const datePickerInput = within(datePicker).getByPlaceholderText(
      'mm/dd/yyyy'
    ) as HTMLInputElement;
    const parsedDate = getParsedDate(todayDate.toDateString());
    expect(datePickerInput?.value).toBe(parsedDate);
  });

  it('should change datepicker value', async () => {
    const todayDate = new Date();
    setup(todayDate);
    const datePicker = screen.getByTestId('test-date');
    const datePickerInput = within(datePicker).getByPlaceholderText(
      'mm/dd/yyyy'
    ) as HTMLInputElement;
    expect(datePickerInput).toBeDefined();

    fireEvent.mouseDown(datePickerInput);
    fireEvent.change(datePickerInput, {
      target: { value: '04/03/1987' },
    });
    await waitFor(() => {
      expect(datePickerInput?.value).toBe('04/03/1987');
    });
  });

  it('should show correctly date with timezone', () => {
    const date = formattedDate(new Date('04/05/1998'), {
      timeZone: 'America/New_York',
    });
    const dateTimeZone = new Date(date);
    setup(dateTimeZone);
    const datePicker = screen.getByTestId('test-date');
    const datePickerInput = within(datePicker).getByPlaceholderText(
      'mm/dd/yyyy'
    ) as HTMLInputElement;
    const parsedDate = getParsedDate(dateTimeZone.toDateString());
    expect(datePickerInput?.value).toBe(parsedDate);
  });
});
