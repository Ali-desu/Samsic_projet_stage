import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/authContext';

interface UseDataFetchingOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  enabled?: boolean;
}

export function useBCs(options?: UseDataFetchingOptions<any[]>) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-bcs'],
    queryFn: async () => {
      const { getAllBCs } = await import('@/features/bon_de_commande/bcApi');
      return getAllBCs();
    },
    enabled: !!user && (options?.enabled ?? true),
    ...options,
  });
}

export function usePrestations(options?: UseDataFetchingOptions<any[]>) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-prestations'],
    queryFn: async () => {
      const { getAllPrestations } = await import('@/features/bon_de_commande/bcApi');
      return getAllPrestations();
    },
    enabled: !!user && (options?.enabled ?? true),
    ...options,
  });
}

export function useSuiviPrestations(options?: UseDataFetchingOptions<any[]>) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['all-suivi-prestations'],
    queryFn: async () => {
      const { getAllSuiviPrestations } = await import('@/features/bon_de_commande/bcApi');
      return getAllSuiviPrestations();
    },
    enabled: !!user && (options?.enabled ?? true),
    ...options,
  });
}

export function useCoordinatorSuivi(options?: UseDataFetchingOptions<any[]>) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['coordinator-suivi-prestations', user?.email],
    queryFn: async () => {
      const { getSuiviPrestationsByCoordinatorEmail } = await import('@/features/prestation/prestationApi');
      return user?.email ? getSuiviPrestationsByCoordinatorEmail(user.email) : Promise.resolve([]);
    },
    enabled: !!user?.email && (options?.enabled ?? true),
    ...options,
  });
}

export function useBackOfficeSuivi(options?: UseDataFetchingOptions<any[]>) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['back-office-suivi-prestations', user?.email],
    queryFn: async () => {
      const { getSuiviPrestationsByBackOfficeEmail } = await import('@/features/prestation/prestationApi');
      return user?.email ? getSuiviPrestationsByBackOfficeEmail(user.email) : Promise.resolve([]);
    },
    enabled: !!user?.email && (options?.enabled ?? true),
    ...options,
  });
} 