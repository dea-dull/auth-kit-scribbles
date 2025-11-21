import { Table, Text, Group, Skeleton } from '@mantine/core';

// Reusable data table component that can be used across different sections
export function DataTable({ 
  data, 
  columns, 
  loading, 
  emptyMessage = "No data found",
  onRowClick,
  ...props 
}) {
  if (loading) {
    return <TableSkeleton columns={columns} />;
  }

  if (!data || data.length === 0) {
    return (
      <Table {...props}>
        <tbody>
          <tr>
            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
              <Text color="dimmed">{emptyMessage}</Text>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }

  return (
    <Table highlightOnHover={!!onRowClick} {...props}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} style={column.headerStyle}>
              {column.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr 
            key={item.id || index} 
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((column) => (
              <td key={column.key} style={column.cellStyle}>
                {column.render ? column.render(item) : item[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function TableSkeleton({ columns, rowCount = 5 }) {
  return (
    <Table>
      <tbody>
        {[...Array(rowCount)].map((_, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => (
              <td key={colIndex}>
                <Group>
                  <Skeleton height={20} width={column.skeletonWidth || 150} />
                </Group>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}