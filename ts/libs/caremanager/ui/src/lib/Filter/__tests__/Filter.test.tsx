import { useState } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Filter } from '../Filter';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';

const items = [
  {
    name: 'name1',
    id: 'id1',
  },
  {
    name: 'name2',
    id: 'id2',
  },
  {
    name: 'name3',
    id: 'id3',
  },
];
const setup = (defaultSelectedIds: string[] = []) => {
  const Wrapper = () => {
    const [selectedIds, setSelectedIds] =
      useState<string[]>(defaultSelectedIds);

    return (
      <Filter
        items={items}
        setSelectedIds={setSelectedIds}
        selectedIds={selectedIds}
        defaultLabel="Filter"
        testid="default-label"
      />
    );
  };

  return renderWithClient(<Wrapper />);
};

describe('Filter', () => {
  it('renders filter', () => {
    setup();
    expect(screen.getByTestId('default-label-filter')).toBeInTheDocument();
  });

  it('dropdown opens on user click', () => {
    setup();
    const carePhaseFilter = screen.getByTestId('default-label-filter');

    fireEvent.click(carePhaseFilter);

    expect(
      screen.getByTestId('default-label-dropdown-list')
    ).toBeInTheDocument();
  });

  it('filter item selected on user checkbox click', () => {
    setup();

    const carePhaseFilter = screen.getByTestId('default-label-filter');
    fireEvent.click(carePhaseFilter);

    const filterCheckbox = screen.getByLabelText(
      items[0].name
    ) as HTMLInputElement;
    fireEvent.click(filterCheckbox);

    expect(filterCheckbox.checked).toBe(true);
  });

  it('filter deselects all on clear click', () => {
    setup(items.map((item) => item.id));

    const filter = screen.getByTestId('default-label-filter');
    fireEvent.click(filter);

    const filterClearButton = screen.getByTestId('clear-filter-button');
    fireEvent.click(filterClearButton);

    items.forEach(({ name }) => {
      const filterCheckbox = screen.getByLabelText(name) as HTMLInputElement;

      expect(filterCheckbox.checked).toBe(false);
    });
  });

  it('filter closes the dropdown on click', async () => {
    setup();
    const carePhaseFilter = screen.getByTestId('default-label-filter');

    fireEvent.click(carePhaseFilter);
    expect(screen.getByTestId('done-filter-button')).toBeInTheDocument();

    const closeButton = screen.getByTestId('done-filter-button');

    fireEvent.click(closeButton);
    await waitFor(() => {
      // takes a few milliseconds for the dropdown to be removed from DOM
      expect(
        screen.queryByTestId('done-filter-button')
      ).not.toBeInTheDocument();
    });
  });
});
