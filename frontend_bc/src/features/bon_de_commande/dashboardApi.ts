import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';

export interface DashboardMetric {
  familleName: string;
  calculationDate: string;
  montantTotalBc: number;
  montantClotureTerrain: number;
  tauxRealisation: number;
  montantReceptionneFacture: number;
  montantDeposeSys: number;
  montantADeposerSys: number;
  montantEnCoursRecepTech: number;
  montantEnCoursRecepTechReserve: number;
  montantRestantBc: number;
  montantTravauxEnCours: number;
}

interface UseDashboardMetricsParams {
  email: string;
  famille: string;
  startDate?: string;
  endDate?: string;
}
const apiUrl = import.meta.env.VITE_API_URL;

// Fetch last 10 days on first load, then FIFO update as new dates appear
export function useDashboardMetrics({ email, famille, startDate, endDate }: UseDashboardMetricsParams) {
  const dataRef = useRef<DashboardMetric[]>([]);
  const initializedRef = useRef(false);

  // Reset data when dependencies change
  useEffect(() => {
    dataRef.current = [];
    initializedRef.current = false;
  }, [email, famille, startDate, endDate]);

  // Calculate default date range: last 10 days
  const today = new Date();
  const defaultEnd = endDate || today.toISOString().slice(0, 10);
  const defaultStart = startDate || (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 9);
    return d.toISOString().slice(0, 10);
  })();

  return useQuery<DashboardMetric[], Error>({
    queryKey: ['dashboard-metrics', email, famille, defaultStart, defaultEnd],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ email, famille, startDate: defaultStart, endDate: defaultEnd });
      const res = await fetch(`${apiUrl}/dashboard/metrics?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      const apiData = await res.json();
      if (Array.isArray(apiData) && apiData.length > 0) {
        // On first load, fill with all available data (sorted by date)
        if (!initializedRef.current) {
          const sorted = [...apiData].sort((a, b) => a.calculationDate.localeCompare(b.calculationDate));
          dataRef.current = sorted.slice(-10);
          initializedRef.current = true;
        } else {
          // Only add new data if its calculationDate is not already present
          const existingDates = new Set(dataRef.current.map(d => d.calculationDate));
          const newData = apiData.filter(d => !existingDates.has(d.calculationDate));
          if (newData.length > 0) {
            // Always keep sorted by date
            dataRef.current = [...dataRef.current, ...newData].sort((a, b) => a.calculationDate.localeCompare(b.calculationDate)).slice(-10);
          }
        }
      }
      return dataRef.current;
    },
    enabled: !!email && !!famille && !!defaultStart && !!defaultEnd,
    refetchInterval: 60 * 1000, // 1 minute
    refetchIntervalInBackground: true,
  });
} 