import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, Search, Filter, X, Package, TrendingUp, DollarSign, Calendar, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface BCDetail {
  numBc: string;
  divisionProjet: string;
  codeProjet: string;
  numLigne: number;
  dateEdition: string;
  descriptionPrestation: string;
  descriptionArticle: string;
  qteBc: number;
  realise: number;
  enCours: number;
  reliquat: number;
  receptionTech: number;
  deposeSys: number;
  receptionneSys: number;
  prixUnite: number;
  familleProjet: string;
  adeposeSys: number;

  // 🆕 Computed fields
  montantHt: number;
  montantCloture: number;
  montantReceptionneTerrain: number;
  montantEnCoursReceptionTech: number;
  montantFactureSysteme: number;
  montantDepose: number;
  montantADeposer: number;
}


interface Column {
  key: keyof BCDetail;
  label: string;
  type: 'text' | 'number' | 'date' | 'quantity' | 'currency';
}

interface SortConfig {
  key: keyof BCDetail;
  direction: 'asc' | 'desc';
}

interface ExcelFilterProps {
  column: keyof BCDetail;
  title: string;
  data: BCDetail[];
  filters: Record<string, string[]>;
  onFilterChange: (column: keyof BCDetail, selectedValues: string[]) => void;
}

const columns: Column[] = [
  { key: 'numBc', label: 'N° BC', type: 'text' },
  { key: 'numLigne', label: 'N° Ligne', type: 'number' },
  { key: 'divisionProjet', label: 'Division Projet', type: 'text' },
  { key: 'codeProjet', label: 'Code Projet', type: 'text' },
  { key: 'dateEdition', label: 'Date Édition', type: 'date' },
  { key: 'descriptionPrestation', label: 'Description Prestation', type: 'text' },
  { key: 'descriptionArticle', label: 'Description Article', type: 'text' },
  { key: 'qteBc', label: 'Qté BC', type: 'quantity' },
  { key: 'realise', label: 'Réalisé', type: 'quantity' },
  { key: 'enCours', label: 'En Cours', type: 'quantity' },
  { key: 'reliquat', label: 'Reliquat', type: 'quantity' },
  { key: 'receptionTech', label: 'Récep Tech', type: 'quantity' },
  { key: 'deposeSys', label: 'Dépose Sys', type: 'quantity' },
  { key: 'receptionneSys', label: 'Récep Sys', type: 'quantity' },
  { key: 'prixUnite', label: 'Prix Unitaire', type: 'currency' },
  { key: 'familleProjet', label: 'Famille Projet', type: 'text' },
  { key: 'adeposeSys', label: 'A Dépose Sys', type: 'quantity' },
  // 🆕 Additional computed columns
  { key: 'montantHt', label: 'Montant HT', type: 'currency' },
  { key: 'montantCloture', label: 'Montant clôturé sur terrain', type: 'currency' },
  { key: 'montantReceptionneTerrain', label: 'Montant réceptionné terrain', type: 'currency' },
  { key: 'montantEnCoursReceptionTech', label: 'Montant en cours réception tech', type: 'currency' },
  { key: 'montantFactureSysteme', label: 'Montant TT Facturé système', type: 'currency' },
  { key: 'montantDepose', label: 'Montant TT Déposé', type: 'currency' },
  { key: 'montantADeposer', label: 'Montant TT A déposer', type: 'currency' },
];


const ExcelFilter: React.FC<ExcelFilterProps> = ({ column, title, data, filters, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>(filters[column] || []);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const uniqueValues = React.useMemo(() => {
    const values = data
      .map(row => row[column])
      .filter(value => value !== null && value !== undefined)
      .map(value => String(value));
    return Array.from(new Set(values)).sort();
  }, [data, column]);

  const filteredValues = React.useMemo(() => {
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

interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <div className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg border border-white/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/80 text-sm font-medium">{title}</p>
        <p className="text-white text-2xl font-bold mt-1">{value}</p>
        {trend && <p className="text-white/60 text-xs mt-1">{trend}</p>}
      </div>
      <div className="bg-white/20 p-3 rounded-lg">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const BCDetails: React.FC = () => {
  const [data, setData] = useState<BCDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchBCDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token d\'authentification non trouvé');

      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) throw new Error('API URL non définie');

      const response = await fetch(`${apiUrl}/prestations/bcDetail`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const result: BCDetail[] = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
      setError(errorMessage);
      console.error('Error fetching BC details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBCDetails();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchBCDetails();
  }, []);

  const handleFilterChange = (column: keyof BCDetail, values: string[]) => {
    setColumnFilters(prev => ({ ...prev, [column]: values }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setGlobalFilter('');
    setCurrentPage(1);
  };

  const filteredAndSortedData = React.useMemo(() => {
    let filtered = [...data];

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
        filtered = filtered.filter(row => values.includes(String(row[column as keyof BCDetail] || '')));
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

  const stats = React.useMemo(() => {
    if (!filteredAndSortedData.length) return { totalBCs: 0, totalQty: 0, totalValue: 0, avgPrice: 0 };

    const uniqueBCs = new Set(filteredAndSortedData.map(item => item.numBc)).size;
    const totalQty = filteredAndSortedData.reduce((sum, item) => sum + (item.qteBc || 0), 0);
    const totalValue = filteredAndSortedData.reduce((sum, item) => sum + ((item.qteBc || 0) * (item.prixUnite || 0)), 0);
    const avgPrice = totalQty ? totalValue / totalQty : 0;

    return { totalBCs: uniqueBCs, totalQty, totalValue, avgPrice };
  }, [filteredAndSortedData]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: keyof BCDetail) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const formatCellValue = (row: BCDetail, column: Column): React.ReactNode => {
    const value = row[column.key];

    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 flex items-center gap-1"><AlertTriangle size={12} />-</span>;
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
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
          {value.toFixed(2)} DH
        </span>
      );
    }

    if (column.type === 'quantity' && typeof value === 'number') {
      const colorClass = value === 0 ? 'bg-gray-100 text-gray-600' : value > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
      return (
        <span className={`${colorClass} px-2 py-1 rounded text-sm font-medium`}>
          {value}
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
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
        >
          Précédent
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 text-sm border rounded-md transition-all duration-200 ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
        >
          Suivant
        </button>
      </div>
    );
  };

  const activeFiltersCount = Object.values(columnFilters).reduce((acc, filters) => acc + filters.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-lg font-semibold text-gray-700">Chargement des détails BC...</div>
          <div className="text-sm text-gray-500 mt-1">Veuillez patienter</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-xl font-semibold text-red-600 mb-2">Erreur de chargement</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchBCDetails}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[98vw] mx-auto bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Détails des Bons de Commande
              </h1>
              <p className="text-gray-600">Visualisation et gestion des détails BC</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total BCs"
            value={stats.totalBCs}
            icon={Package}
            color="from-blue-500 to-blue-600"
            trend={`${data.length} articles`}
          />
          <StatsCard
            title="Quantité Totale"
            value={stats.totalQty.toFixed(0)}
            icon={TrendingUp}
            color="from-green-500 to-green-600"
            trend="Articles commandés"
          />
          <StatsCard
            title="Valeur Totale"
            value={`${stats.totalValue.toFixed(2)} DH`}
            icon={DollarSign}
            color="from-purple-500 to-purple-600"
            trend="Montant total"
          />
          <StatsCard
            title="Prix Moyen"
            value={`${stats.avgPrice.toFixed(2)} DH`}
            icon={Calendar}
            color="from-orange-500 to-orange-600"
            trend="Par unité"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
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
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
                Effacer Filtres
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 border border-blue-200">
          <div className="text-sm text-gray-700">
            Affichage de <span className="font-semibold text-blue-700">{paginatedData.length}</span> sur{' '}
            <span className="font-semibold text-blue-700">{filteredAndSortedData.length}</span> résultats filtrés
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs">
                {activeFiltersCount} filtre{activeFiltersCount !== 1 ? 's' : ''} actif{activeFiltersCount !== 1 ? 's' : ''}
              </span>
            )}
            <span className="ml-2">• Page {currentPage} sur {totalPages}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-200">
                  {columns.map(col => (
                    <th key={col.key} className={`text-left py-4 px-4 font-semibold text-gray-900 border-r border-gray-200 min-w-[120px] ${
                      col.type === 'quantity' ? 'bg-blue-50' : col.type === 'currency' ? 'bg-green-50' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200"
                        >
                          <span className="truncate">{col.label}</span>
                          <div className="flex flex-col">
                            <ChevronUp 
                              className={`h-3 w-3 transition-colors duration-200 ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
                            />
                            <ChevronDown 
                              className={`h-3 w-3 transition-colors duration-200 ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
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
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr
                      key={`${row.numBc}-${row.numLigne}-${index}`}
                      className={`hover:bg-blue-50 transition-all duration-200 border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      {columns.map(col => (
                        <td key={col.key} className={`py-3 px-4 border-r border-gray-100 ${
                          col.type === 'quantity' ? 'bg-blue-25' : col.type === 'currency' ? 'bg-green-25' : ''
                        }`}>
                          <div className="max-w-[200px] truncate" title={String(row[col.key] || '')}>
                            {formatCellValue(row, col)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-4">
                        <Search className="h-12 w-12 text-gray-300" />
                        <div>
                          <div className="text-lg font-semibold mb-1">Aucune donnée trouvée</div>
                          <div className="text-sm">Essayez d'ajuster vos filtres ou termes de recherche</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> sur{' '}
                <span className="font-semibold">{totalPages}</span> •{' '}
                {filteredAndSortedData.length} résultats au total
              </div>
              {renderPagination()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BCDetails;
