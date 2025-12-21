import { SimpleGrid, Card, Group, Text, Box } from '@mantine/core';

// Reusable stats grid for dashboard sections
export  function StatsGrid({ stats, loading }) {
  if (loading) {
    return <StatsGridSkeleton count={stats.length} />;
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: stats.length }} spacing="md">
      {stats.map(({ label, value, icon: Icon, description, color }) => (
        <Card key={label} p="md" radius="md" className="stat-card">
          <Group align="center" gap="md">
            {Icon && (
              <Icon 
                size={34} 
                className="stat-icon" 
                color={color}
                aria-hidden="true" 
              />
            )}
            <Box>
              <Text size="xl" fw={600}>
                {value}
              </Text>
              <Text size="sm" color="dimmed">
                {label}
              </Text>
              {description && (
                <Text size="xs" color="dimmed" mt={4}>
                  {description}
                </Text>
              )}
            </Box>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
}

export function StatsGridSkeleton({ count = 3 }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: count }} spacing="md">
      {[...Array(count)].map((_, index) => (
        <Card key={index} p="md" radius="md">
          <Group>
            <Skeleton height={34} width={34} circle />
            <Box>
              <Skeleton height={24} width={60} mb={8} />
              <Skeleton height={16} width={100} />
            </Box>
          </Group>
        </Card>
      ))}
    </SimpleGrid>
  );
}