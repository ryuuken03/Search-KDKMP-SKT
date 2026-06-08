import { useState, useEffect } from 'react';

const getItemsPerPage = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? 10 : 20;
  }
  return 20;
};

export function useItemsPerPage() {
  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

  useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return itemsPerPage;
}
