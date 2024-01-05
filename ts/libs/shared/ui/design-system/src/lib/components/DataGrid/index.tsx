import {
  DataGrid as MuiDataGrid,
  DataGridProps as MuiDataGridProps,
} from '@mui/x-data-grid';

export type DataGridProps = MuiDataGridProps;

const DataGrid = (props: DataGridProps) => <MuiDataGrid {...props} />;

export default DataGrid;
