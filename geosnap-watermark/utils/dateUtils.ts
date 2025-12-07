export const getFormattedDateTime = (): string => {
  const now = new Date();
  
  // Format: DD/MM/YYYY HH:mm:ss
  const date = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const time = now.toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `${date} • ${time}`;
};

export const getFormattedDateParts = () => {
  const now = new Date();
  
  // Example: 24 Januari 2024
  const date = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Example: 09:30
  const time = now.toLocaleTimeString('id-ID', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  return { date, time };
};