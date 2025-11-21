import { Skeleton, Group, Table } from '@mantine/core';

export  function FilesSkeleton() {
  return (
    <Table>
      <tbody>
        {[...Array(4)].map((_, index) => (
          <tr key={index}>
            <td>
              <Group>
                <Skeleton height={20} circle width={20} />
                <Skeleton height={20} width={150} />
              </Group>
            </td>
            <td>
              <Skeleton height={20} width={100} />
            </td>
            <td>
              <Skeleton height={30} width={30} circle />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}