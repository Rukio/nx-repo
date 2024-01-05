export type FilterOptionItem = {
  id: number | string;
  name: string;
};

export type FilterOption = {
  title: string;
  optionsTitle: string;
  options: FilterOptionItem[];
  filteredOptions: FilterOptionItem[];
  searchText: string;
  filterBy: string[];
};
