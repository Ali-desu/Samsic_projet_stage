
import React, { type FC, type ReactNode } from 'react';
import { 
  BarChart3,  
  FileText, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  Activity,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  type LucideIcon
} from 'lucide-react';
import { useAuth } from '@/features/auth/authContext';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Interface for dashboard metrics
interface DashboardMetric {
  familleProjet: string;
  montantTotalBC: number;
  montantClotureTerrain: number;
  tauxRealisation: number;
  montantReceptionneFacture: number;
  montantDeposeReceptionSys: number;
  montantADeposerReceptionSys: number;
  montantEnCoursRecepTech: number;
  montantAvecReserveRecepTech: number;
  montantRestantBC: number;
  montantTravauxEnCoursCodeSite: number;
}

// Interface for user data from useAuth
interface User {
  name: string;
  role: string;
}




// Interface for metric configuration
interface MetricConfig {
  key: keyof DashboardMetric;
  label: string;
  format: (value: number) => string;
  icon: LucideIcon;
}



// Hook to fetch backoffices for chef
const useBackoffices = () => {
  return useQuery<string[], Error>({
    queryKey: ['backoffices'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiUrl}/users/backoffices`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch backoffices');
      return res.json();
    },
    enabled: true,
  });
};

// Hook to fetch dashboard data
const useDashboardMetrics = (email?: string) => {
  return useQuery<DashboardMetric[], Error>({
    queryKey: ['dashboard-metrics', email],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      const url = email 
        ? `${apiUrl}/prestations/tableau-de-bord/by-backoffice/${encodeURIComponent(email)}` 
        : `${apiUrl}/prestations/tableau-de-bord`;
      const res = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      return res.json();
    },
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
  });
};

// Component props interfaces
interface CardProps {
  children: ReactNode;
  className?: string;
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Card components with professional styling
const Card: FC<CardProps> = ({ children, className = "" }) => (
  <div className={cn(`bg-card border border-border rounded-lg shadow-sm animate-fade-in`, className)}>
    {children}
  </div>
);

const CardHeader: FC<CardProps> = ({ children, className = "" }) => (
  <div className={cn(`p-4 sm:p-6`, className)}>
    {children}
  </div>
);

const CardContent: FC<CardProps> = ({ children, className = "" }) => (
  <div className={cn(`p-4 sm:p-6`, className)}>
    {children}
  </div>
);

const CardTitle: FC<CardProps> = ({ children, className = "" }) => (
  <h3 className={cn(`text-lg font-semibold text-foreground`, className)}>
    {children}
  </h3>
);

// Professional Button component
const Button: FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled, 
  variant = "primary", 
  size = "md",
  className = "" 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };
  
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4",
    lg: "h-10 px-6"
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
};

// Professional Table components
const Table: FC<CardProps> = ({ children, className = "" }) => (
  <div className={cn("w-full overflow-x-auto", className)}>
    <table className={cn("w-full text-sm min-w-[1000px]", className)}>
      {children}
    </table>
  </div>
);

const TableHeader: FC<CardProps> = ({ children }) => (
  <thead className="border-b border-border">
    {children}
  </thead>
);

const TableBody: FC<CardProps> = ({ children }) => (
  <tbody className="divide-y divide-border">
    {children}
  </tbody>
);

const TableRow: FC<CardProps> = ({ children, className = "" }) => (
  <tr className={cn(`hover:bg-muted/50 transition-colors`, className)}>
    {children}
  </tr>
);

const TableHead: FC<CardProps> = ({ children, className = "" }) => (
  <th className={cn(`h-12 px-2 text-left align-middle font-semibold text-muted-foreground text-xs`, className)}>
    {children}
  </th>
);

const TableCell: FC<CardProps> = ({ children, className = "" }) => (
  <td className={cn(`p-2 align-middle text-xs`, className)}>
    {children}
  </td>
);

// Mobile Card for Table Rows
const MobileTableCard: FC<{ row: DashboardMetric; metrics: MetricConfig[] }> = ({ row, metrics }) => (
  <div className="sm:hidden bg-card border border-border rounded-lg p-4 mb-4">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full bg-primary"></div>
      <h4 className="font-medium text-sm truncate">{row.familleProjet}</h4>
    </div>
    <div className="grid grid-cols-1 gap-2">
      {metrics.map(m => (
        <div key={m.key} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <m.icon className="w-4 h-4" />
            <span className="text-sm">{m.label}</span>
          </div>
          <span className={cn(
            `text-sm font-medium px-2 py-1 rounded`,
            m.key === 'tauxRealisation' 
              ? Number(row[m.key]) >= 80 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : Number(row[m.key]) >= 50
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
          )}>
            {m.format(Number(row[m.key] ?? 0))}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Professional Metric Panel Component
const MetricPanel: FC<{
  metrics: { title: string; value: string; icon: LucideIcon }[];
}> = ({ metrics }) => (
  <div className="bg-card border border-border rounded-lg shadow-sm animate-slide-up p-4 sm:p-6">
    <h3 className="text-lg font-semibold text-foreground mb-4">Indicateurs Clés</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {metrics.map(({ title, value, icon: Icon }) => (
        <div key={title} className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    coordinateur: 'Coordinateur',
    back_office: 'Back Office',
    chef_projet: 'Chef de Projet',
    responsable_compte: 'Responsable Compte'
  };
  return roleNames[role] || role;
};

const Dashboard: FC = () => {
  const { user } = useAuth() as { user: User | null };
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const isChef = user?.role === 'chef_projet';
  const [selectedBackoffice, setSelectedBackoffice] = React.useState<string | undefined>(undefined);

  const { data: backoffices } = useBackoffices();
  const { data: dashboardData, isLoading: isFetching, error } = useDashboardMetrics(selectedBackoffice);

  // Compute summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!dashboardData || dashboardData.length === 0) return null;

    const totals = dashboardData.reduce((acc, row) => ({
      totalBC: acc.totalBC + Number(row.montantTotalBC ?? 0),
      totalCloture: acc.totalCloture + Number(row.montantClotureTerrain ?? 0),
      totalRestant: acc.totalRestant + Number(row.montantRestantBC ?? 0),
      totalTravaux: acc.totalTravaux + Number(row.montantTravauxEnCoursCodeSite ?? 0),
    }), {
      totalBC: 0,
      totalCloture: 0,
      totalRestant: 0,
      totalTravaux: 0,
    });

    const avgRealization = dashboardData.reduce((acc, row) => acc + Number(row.tauxRealisation ?? 0), 0) / dashboardData.length;

    return {
      ...totals,
      avgRealization,
      projectCount: dashboardData.length,
    };
  }, [dashboardData]);

  // Table columns configuration
  const metrics: MetricConfig[] = [
    { key: 'montantTotalBC', label: 'Total BC', format: formatCurrency, icon: DollarSign },
    { key: 'montantClotureTerrain', label: 'Clôture Terrain', format: formatCurrency, icon: CheckCircle },
    { key: 'tauxRealisation', label: 'Taux Réalisation', format: formatPercentage, icon: TrendingUp },
    { key: 'montantReceptionneFacture', label: 'Réception Facture', format: formatCurrency, icon: FileText },
    { key: 'montantDeposeReceptionSys', label: 'Déposé Système', format: formatCurrency, icon: CheckCircle },
    { key: 'montantADeposerReceptionSys', label: 'À Déposer Système', format: formatCurrency, icon: AlertCircle },
    { key: 'montantEnCoursRecepTech', label: 'En Cours Récep. Tech', format: formatCurrency, icon: Activity },
    { key: 'montantAvecReserveRecepTech', label: 'Récep. Tech Réserve', format: formatCurrency, icon: AlertCircle },
    { key: 'montantRestantBC', label: 'Restant', format: formatCurrency, icon: DollarSign },
    { key: 'montantTravauxEnCoursCodeSite', label: 'Travaux En Cours', format: formatCurrency, icon: Settings },
  ];

  // Metrics for the panel
  const panelMetrics = summaryMetrics ? [
    { title: 'Total Projets', value: summaryMetrics.projectCount.toString(), icon: BarChart3 },
    { title: 'Réalisation Moyenne', value: formatPercentage(summaryMetrics.avgRealization), icon: TrendingUp },
    { title: 'Total BC', value: formatCurrency(summaryMetrics.totalBC), icon: DollarSign },
    { title: 'En Cours', value: formatCurrency(summaryMetrics.totalTravaux), icon: Activity },
  ] : [];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Tableau de Bord
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1 text-sm">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{user.name}</span> • {getRoleDisplayName(user.role)}
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            size="sm"
            disabled={isLoading || isFetching}
            className="gap-2"
          >
            <RefreshCw className={cn(`w-4 h-4`, isLoading || isFetching ? 'animate-spin' : '')} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Backoffice Selection for Chef */}
      {isChef && (
        <Card className="p-4 sm:p-6">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-sm font-medium text-foreground">
                Sélectionner un Backoffice
              </label>
              <Select value={selectedBackoffice} onValueChange={setSelectedBackoffice}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Choisir un backoffice" />
                </SelectTrigger>
                <SelectContent>
                  {backoffices?.map(email => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metric Panel */}
      {summaryMetrics && (
        <MetricPanel metrics={panelMetrics} />
      )}

      {/* Dashboard Table */}
      {user.role !== 'coordinateur' && (
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Familles de Projets
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Vue d'ensemble des métriques par famille de projet
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {(isLoading || isFetching) && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Chargement des données...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-center py-16">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Erreur de chargement</h3>
                <p className="text-muted-foreground mb-4">{error.message}</p>
                <Button onClick={handleRefresh} variant="ghost">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            )}
            
            {!isLoading && !isFetching && !error && (
              <>
                {dashboardData && dashboardData.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px] md:w-[200px]">
                            <div className="flex items-center gap-1">
                              Famille de Projet
                            </div>
                          </TableHead>
                          {metrics.map(m => (
                            <TableHead key={m.key} className="text-center">
                              <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                                <m.icon className="w-4 h-4" />
                                <span>{m.label}</span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardData.map((row) => (
                          <TableRow key={row.familleProjet}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                {row.familleProjet}
                              </div>
                            </TableCell>
                            {metrics.map(m => (
                              <TableCell key={m.key} className="text-center">
                                <span className={cn(
                                  `inline-flex items-center px-2 py-1 rounded font-medium`,
                                  m.key === 'tauxRealisation' 
                                    ? Number(row[m.key]) >= 80 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                      : Number(row[m.key]) >= 50
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-muted text-muted-foreground'
                                )}>
                                  {m.format(Number(row[m.key] ?? 0))}
                                </span>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {/* Mobile Cards */}
                    {dashboardData.map((row) => (
                      <MobileTableCard key={row.familleProjet} row={row} metrics={metrics} />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-16">
                    <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucune donnée disponible</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun projet n'a été trouvé pour le moment.
                    </p>
                    <Button onClick={handleRefresh} variant="ghost">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;