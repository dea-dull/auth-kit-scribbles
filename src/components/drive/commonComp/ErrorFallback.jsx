import { Alert, Button, Group } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export  function ErrorFallback({ error, onRetry }) {
  return (
    <Alert 
      icon={<IconAlertCircle size={16} />} 
      title="Error" 
      color="red" 
      variant="filled"
      mb="md"
    >
      <Group position="apart">
        <div>
          {String(error || 'Something went wrong')}
        </div>
        {onRetry && (
          <Button size="xs" variant="white" onClick={onRetry}>
            Retry
          </Button>
        )}
      </Group>
    </Alert>
  );
}
