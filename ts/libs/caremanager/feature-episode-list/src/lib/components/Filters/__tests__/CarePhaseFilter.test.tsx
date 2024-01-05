import { useState } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import CarePhaseFilter from '../CarePhaseFilter';
import { JSONMocks } from '@*company-data-covered*/caremanager/utils-mocks';
import {
  CarePhase,
  CarePhaseFromJSON,
} from '@*company-data-covered*/caremanager/data-access-types';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';

const results: Array<CarePhase> = [];
JSONMocks.config.care_phases.forEach((carePhase) =>
  results.push(CarePhaseFromJSON(carePhase))
);

const setup = (defaultSelectedIds: string[] = []) => {
  const Wrapper = () => {
    const [selectedIds, setSelectedIds] =
      useState<string[]>(defaultSelectedIds);

    return (
      <CarePhaseFilter
        items={results}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
      />
    );
  };

  return renderWithClient(<Wrapper />);
};

describe('CarePhaseFilter', () => {
  it('renders care phase filter', () => {
    setup();
    expect(screen.getByTestId('care-phase-filter')).toBeInTheDocument();
  });

  it('care phase dropdown opens on user click', () => {
    setup();
    const carePhaseFilter = screen.getByTestId('care-phase-filter');

    fireEvent.click(carePhaseFilter);

    expect(screen.getByTestId('care-phase-dropdown-list')).toBeInTheDocument();
  });

  it('care phases selected on user checkbox click', () => {
    setup();

    const carePhaseFilter = screen.getByTestId('care-phase-filter');
    fireEvent.click(carePhaseFilter);

    const carePhaseCheckbox = screen.getByLabelText(
      `${JSONMocks.config.care_phases[0].name}`
    ) as HTMLInputElement;
    fireEvent.click(carePhaseCheckbox);

    expect(carePhaseCheckbox.checked).toBe(true);
  });

  it('care phases selected all on select all click', () => {
    setup(results.map((result) => result.id));

    const carePhaseFilter = screen.getByTestId('care-phase-filter');
    fireEvent.click(carePhaseFilter);
    const carePhaseCheckbox = screen.getByLabelText(
      `${JSONMocks.config.care_phases[0].name}`
    ) as HTMLInputElement;

    expect(carePhaseCheckbox.checked).toBe(true);
  });
});
