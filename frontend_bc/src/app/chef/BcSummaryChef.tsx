import React, { type FC, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Search, Filter, X, Package, TrendingUp, DollarSign, BarChart3, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '@/features/auth/authContext';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BCSummary {
  numBc: string;
  divisionProjet: string;
  codeProjet: string;
  dateEdition: string;
  familleProjet: string;
  descriptionPrestation: string;
  montantHt: number;
  montantCloture: number;
  montantFactureSys: number;
  montantDepose: number;
  montantADeposer: number;
  tauxRealisation: number;
  tec: number;
}

interface Column {
  key: keyof BCSummary;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  icon: React.ElementType;
}

interface SortConfig {
  key: keyof BCSummary;
  direction: 'asc' | 'desc';
}

interface ExcelFilterProps {
  column: keyof BCSummary;
  title: string;
  data: BCSummary[];
  filters: Record<string, string[]>;
  onFilterChange: (column: keyof BCSummary, selectedValues: string[]) => void;
}

interface User {
  name: string;
  role: string;
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

const Card: FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader: FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardContent: FC<CardProps> = ({ children, className = "" }) => (
  <div className={`px-6 pb-6 ${className}`}>
    {children}
  </div>
);

const CardTitle: FC<CardProps> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const Button: FC<ButtonProps> = ({ children, onClick, disabled, variant = "primary", className = "" }) => {
  const baseClasses = "inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<string, string> = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
    secondary: "bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 focus:ring-indigo-500",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-indigo-500"
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Table: FC<CardProps> = ({ children, className = "" }) => (
  <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
    <table className={`min-w-[1200px] divide-y divide-gray-300 ${className}`}>
      {children}
    </table>
  </div>
);

const TableHeader: FC<CardProps> = ({ children }) => (
  <thead className="bg-gray-50">
    {children}
  </thead>
);

const TableBody: FC<CardProps> = ({ children }) => (
  <tbody className="divide-y divide-gray-200 bg-white">
    {children}
  </tbody>
);

const TableRow: FC<CardProps> = ({ children, className = "" }) => (
  <tr className={className}>
    {children}
  </tr>
);

const TableHead: FC<CardProps> = ({ children, className = "" }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

const TableCell: FC<CardProps> = ({ children, className = "" }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
    {children}
  </td>
);

const columns: Column[] = [
  { key: 'numBc', label: 'N° BC', type: 'text', icon: Package },
  { key: 'divisionProjet', label: 'Division Projet', type: 'text', icon: Package },
  { key: 'codeProjet', label: 'Code Projet', type: 'text', icon: Package },
  { key: 'dateEdition', label: 'Date Édition', type: 'date', icon: Calendar },
  { key: 'familleProjet', label: 'Famille Projet', type: 'text', icon: Package },
  { key: 'descriptionPrestation', label: 'Description Prestation', type: 'text', icon: Package },
  { key: 'montantHt', label: 'Montant HT', type: 'currency', icon: DollarSign },
  { key: 'montantCloture', label: 'Montant Clôturé', type: 'currency', icon: DollarSign },
  { key: 'montantFactureSys', label: 'Montant Facturé Sys', type: 'currency', icon: DollarSign },
  { key: 'montantDepose', label: 'Montant Déposé', type: 'currency', icon: DollarSign },
  { key: 'montantADeposer', label: 'Montant À Déposer', type: 'currency', icon: DollarSign },
  { key: 'tauxRealisation', label: 'Taux Réalisation', type: 'percentage', icon: TrendingUp },
  { key: 'tec', label: 'TEC', type: 'currency', icon: DollarSign },
];

const ExcelFilter: FC<ExcelFilterProps> = ({ column, title, data, filters, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>(filters[column] || []);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const uniqueValues = useMemo(() => {
    const values = data
      .map(row => row[column])
      .filter(value => value !== null && value !== undefined)
      .map(value => String(value));
    return Array.from(new Set(values)).sort();
  }, [data, column]);

  const filteredValues = useMemo(() => {
    if (!searchTerm) return uniqueValues;
    return uniqueValues.filter(value => value.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [uniqueValues, searchTerm]);

  const handleApplyFilter = () => {
    onFilterChange(column, selectedValues);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    setSelectedValues(selectedValues.length === uniqueValues.length ? [] : [...uniqueValues]);
  };

  const handleValueToggle = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const hasActiveFilter = filters[column]?.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded hover:bg-gray-200 transition-all duration-200 ${hasActiveFilter ? 'bg-blue-100 text-blue-700 shadow-sm' : ''}`}
      >
        <Filter className="h-4 w-4" />
        {hasActiveFilter && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
            {filters[column].length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-700">{title}</span>
              <button
                onClick={() => {
                  onFilterChange(column, []);
                  setSelectedValues([]);
                }}
                className="text-xs text-red-600 hover:text-red-800 transition-colors duration-200"
              >
                Effacer
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div className="p-2 border-b border-gray-100">
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded p-1 transition-colors duration-200">
              <input
                type="checkbox"
                checked={selectedValues.length === uniqueValues.length}
                onChange={handleSelectAll}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Tout sélectionner ({uniqueValues.length})
              </span>
            </label>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredValues.map(value => (
              <label key={value} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-blue-50 cursor-pointer transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => handleValueToggle(value)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm flex-1 truncate text-gray-700">
                  {value || <em className="text-gray-400">(vide)</em>}
                </span>
              </label>
            ))}
          </div>
          <div className="p-3 border-t border-gray-100 flex justify-end space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
            >
              Annuler
            </button>
            <button
              onClick={handleApplyFilter}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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

const useBcSummaries = (email?: string) => {
  return useQuery<BCSummary[], Error>({
    queryKey: ['bc-summaries', email],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL;
      const url = email 
        ? `${apiUrl}/prestations/bon-de-commande/summary/by-backoffice/${encodeURIComponent(email)}`
        : `${apiUrl}/prestations/bon-de-commande/summary`;
      const res = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch BC summaries');
      return res.json();
    },
    refetchInterval: 60 * 1000, // Refetch every 1 minute
    refetchIntervalInBackground: true,
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const StatsCard: FC<{ title: string; value: React.ReactNode; icon: React.ElementType; color: string; trend?: string }> = ({ title, value, icon: Icon, color, trend }) => (
  <Card className={`bg-gradient-to-br ${color} text-white border-0 shadow-lg`}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && <p className="text-white/60 text-xs mt-1">{trend}</p>}
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const BCSummary: FC = () => {
  const { user } = useAuth() as { user: User | null };
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const isChef = user?.role === 'chef_projet';
  const [selectedBackoffice, setSelectedBackoffice] = useState<string | undefined>(isChef ? undefined : user?.name);

  const { data: backoffices } = useBackoffices();
  const { data, isLoading, error } = useBcSummaries(selectedBackoffice);

  const stats = useMemo(() => {
    if (!data || !data.length) return { 
      totalBCs: 0, 
      totalMontantHt: 0, 
      totalMontantCloture: 0, 
      avgTauxRealisation: 0 
    };

    const totalBCs = data.length;
    const totalMontantHt = data.reduce((sum, item) => sum + (item.montantHt || 0), 0);
    const totalMontantCloture = data.reduce((sum, item) => sum + (item.montantCloture || 0), 0);
    const avgTauxRealisation = data.reduce((sum, item) => sum + (item.tauxRealisation || 0), 0) / totalBCs;

    return { totalBCs, totalMontantHt, totalMontantCloture, avgTauxRealisation };
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data ? [...data] : [];

    if (globalFilter) {
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return String(value || '').toLowerCase().includes(globalFilter.toLowerCase());
        })
      );
    }

    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(row => values.includes(String(row[column as keyof BCSummary] || '')));
      }
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [data, globalFilter, columnFilters, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: keyof BCSummary) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFilterChange = (column: keyof BCSummary, values: string[]) => {
    setColumnFilters(prev => ({ ...prev, [column]: values }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setGlobalFilter('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatCellValue = (row: BCSummary, column: Column): React.ReactNode => {
    const value = row[column.key];

    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 flex items-center gap-1"><AlertCircle size={12} />-</span>;
    }

    if (column.type === 'date' && value) {
      try {
        return format(new Date(value), 'dd/MM/yyyy');
      } catch {
        return String(value);
      }
    }

    if (column.type === 'currency' && typeof value === 'number') {
      return (
        <span className="bg-green-50 text-green-700 px-2.5 py-1.5 rounded-full text-sm font-medium">
          {formatCurrency(value)}
        </span>
      );
    }

    if (column.type === 'percentage' && typeof value === 'number') {
      const colorClass = value >= 0.8 ? 'bg-green-100 text-green-800' : 
                        value >= 0.5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800';
      return (
        <span className={`${colorClass} px-2.5 py-1.5 rounded-full text-sm font-medium`}>
          {formatPercentage(value)}
        </span>
      );
    }

    return String(value);
  };

  const renderPagination = () => {
    const pages: number[] = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-1">
        <Button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          variant="outline"
        >
          Précédent
        </Button>
        {startPage > 1 && (
          <>
            <Button onClick={() => setCurrentPage(1)} variant="outline">1</Button>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        {pages.map(page => (
          <Button
            key={page}
            onClick={() => setCurrentPage(page)}
            variant={page === currentPage ? 'primary' : 'outline'}
          >
            {page}
          </Button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <Button onClick={() => setCurrentPage(totalPages)} variant="outline">{totalPages}</Button>
          </>
        )}
        <Button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          variant="outline"
        >
          Suivant
        </Button>
      </div>
    );
  };

  const activeFiltersCount = Object.values(columnFilters).reduce((acc, filters) => acc + filters.length, 0);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Résumé des Bons de Commande
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {isChef && (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Sélectionner un Backoffice
                </label>
                <Select
                  value={selectedBackoffice}
                  onValueChange={setSelectedBackoffice}
                >
                  <SelectTrigger className="w-[300px]">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total BCs"
            value={stats.totalBCs}
            icon={Package}
            color="from-blue-500 to-cyan-600"
            trend="Bons de commande"
          />
          <StatsCard
            title="Montant HT Total"
            value={formatCurrency(stats.totalMontantHt)}
            icon={DollarSign}
            color="from-green-500 to-emerald-600"
            trend="Montant total"
          />
          <StatsCard
            title="Montant Clôturé"
            value={formatCurrency(stats.totalMontantCloture)}
            icon={TrendingUp}
            color="from-purple-500 to-pink-600"
            trend="Clôturé"
          />
          <StatsCard
            title="Taux Réalisation Moyen"
            value={formatPercentage(stats.avgTauxRealisation)}
            icon={BarChart3}
            color="from-orange-500 to-amber-500"
            trend="Performance moyenne"
          />
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Tableau des Résumés des Bons de Commande
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Vue d'ensemble des métriques par bon de commande
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row gap-4 p-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher dans toutes les colonnes..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <option value={5}>5 par page</option>
                  <option value={10}>10 par page</option>
                  <option value={20}>20 par page</option>
                  <option value={50}>50 par page</option>
                  <option value={100}>100 par page</option>
                </select>
                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Effacer Filtres
                </Button>
              </div>
            </div>
            {(isLoading || isRefreshing) && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-gray-600">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Chargement des données...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-center py-16">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
                <p className="text-gray-600 mb-4">{error.message}</p>
                <Button onClick={handleRefresh} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            )}
            {!isLoading && !isRefreshing && !error && (
              <>
                {data && data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.map(col => (
                          <TableHead key={col.key} className="text-center min-w-[140px]">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSort(col.key)}
                                className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200"
                              >
                                <col.icon className="w-4 h-4" />
                                <span className="text-xs">{col.label}</span>
                                <div className="flex flex-col">
                                  <ChevronUp 
                                    className={`h-3 w-3 ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
                                  />
                                  <ChevronDown 
                                    className={`h-3 w-3 ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
                                  />
                                </div>
                              </button>
                              <ExcelFilter
                                column={col.key}
                                title={col.label}
                                data={data}
                                filters={columnFilters}
                                onFilterChange={handleFilterChange}
                              />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row, index) => (
                        <TableRow 
                          key={`${row.numBc}-${index}`} 
                          className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                        >
                          {columns.map(col => (
                            <TableCell key={col.key} className="text-center min-w-[140px]">
                              {formatCellValue(row, col)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-16">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune donnée disponible</h3>
                    <p className="text-gray-600 mb-4">
                      Aucun bon de commande n'a été trouvé pour le moment.
                    </p>
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Réessayer
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Affichage de <span className="font-semibold text-blue-700">{paginatedData.length}</span> sur{' '}
                  <span className="font-semibold text-blue-700">{filteredAndSortedData.length}</span> résultats filtrés
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {activeFiltersCount} filtre{activeFiltersCount !== 1 ? 's' : ''} actif{activeFiltersCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="ml-2">• Page {currentPage} sur {totalPages}</span>
                </div>
                {renderPagination()}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BCSummary;