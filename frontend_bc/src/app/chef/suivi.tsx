import { useQuery } from '@tanstack/react-query';
import { getAllSuiviPrestations } from '@/features/bon_de_commande/bcApi';
import { ChevronUp, ChevronDown, X, Filter, Search, AlertTriangle, Eye, Download, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';

// Interfaces based on database response
interface FileResponse {
  id: number;
  name: string;
  contentType: string;
}

interface ZoneResponse {
  id: number;
  name: string;
}

interface ServiceResponse {
  id: number;
  nomService: string;
  prix: number;
}

interface PrestationResponse {
  id: string;
  numLigne: number;
  description: string;
  qteBc: number;
  famille: string;
  zone: ZoneResponse;
  service: ServiceResponse;
}

interface SuiviPrestationResponse {
  id: number;
  prestation: PrestationResponse;
  coordinateurId: number;
  zone: ZoneResponse;
  qteRealise: number;
  qteEncours: number;
  qteTech: number;
  qteDepose: number;
  qteADepose: number;
  qteSys: number;
  fournisseur: string;
  datePlanifiee: string | null;
  dateGo: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateRealisation: string | null;
  statutDeRealisation: string | null;
  dateRecepTech: string | null;
  statutReceptionTech: string | null;
  datePf: string | null;
  dateRecepSys: string | null;
  statutReceptionSystem: string | null;
  remarque: string | null;
  delaiRecep: number;
  bc_num: string;
  site: string | null;
  dateEdition: string;
  fichierReceptionTech: FileResponse | null;
  error: string | null;
}

interface Column {
  key: string;
  label: string;
  type?: 'currency' | 'qty' | 'date' | 'file';
}

const columns: Column[] = [
  { key: 'bc_num', label: 'BC Num' },
  { key: 'prestation.numLigne', label: 'Num Ligne' },
  { key: 'prestation.description', label: 'Description' },
  { key: 'prestation.famille', label: 'Famille' },
  { key: 'prestation.service.nomService', label: 'Service' },
  { key: 'prestation.service.prix', label: 'Prix Unitaire', type: 'currency' },
  { key: 'qteRealise', label: 'Qté Réalisée', type: 'qty' },
  { key: 'qteEncours', label: 'Qté En Cours', type: 'qty' },
  { key: 'zone.name', label: 'Zone' },
  { key: 'site', label: 'Site' },
  { key: 'fournisseur', label: 'Fournisseur' },
  { key: 'datePlanifiee', label: 'Date Planifiée', type: 'date' },
  { key: 'dateGo', label: 'Date GO', type: 'date' },
  { key: 'dateDebut', label: 'Date Début', type: 'date' },
  { key: 'dateFin', label: 'Date Fin', type: 'date' },
  { key: 'dateRealisation', label: 'Date Réalisation', type: 'date' },
  { key: 'statutDeRealisation', label: 'Statut Réalisation' },
  { key: 'dateRecepTech', label: 'Date Récep Tech', type: 'date' },
  { key: 'statutReceptionTech', label: 'Statut Récep Tech' },
  { key: 'datePf', label: 'Date PF', type: 'date' },
  { key: 'dateRecepSys', label: 'Date Récep Sys', type: 'date' },
  { key: 'statutReceptionSystem', label: 'Statut Réception Système' },
  { key: 'remarque', label: 'Remarque' },
  { key: 'delaiRecep', label: 'Délai Récep' },
  { key: 'fichierReceptionTech', label: 'Fichier Récep Tech', type: 'file' },
];

const getNested = (obj: any, path: string): any => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), obj);
};

const ExcelFilter: React.FC<{
  column: string;
  title: string;
  data: SuiviPrestationResponse[];
  filters: Record<string, string[]>;
  onFilterChange: (column: string, values: string[]) => void;
}> = ({ column, title, data, filters, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>(filters[column] || []);
  const [isOpen, setIsOpen] = useState(false);

  const uniqueValues = useMemo(() => {
    const values = data
      .map(row => getNested(row, column))
      .filter(value => value !== null && value !== undefined)
      .map(value => String(value));
    return Array.from(new Set(values)).sort();
  }, [data, column]);

  const filteredValues = useMemo(() => {
    if (!searchTerm) return uniqueValues;
    return uniqueValues.filter(value =>
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
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
        className={`p-2 rounded-lg transition-all duration-200 hover:bg-white/60 ${
          hasActiveFilter 
            ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-sm' 
            : 'hover:shadow-sm'
        }`}
      >
        <Filter className="h-4 w-4" />
        {hasActiveFilter && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg">
            {filters[column].length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                {title}
              </span>
              <button
                onClick={() => {
                  onFilterChange(column, []);
                  setSelectedValues([]);
                }}
                className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors duration-200"
              >
                Clear
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedValues.length === uniqueValues.length}
                onChange={handleSelectAll}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors duration-200">
                Select All ({uniqueValues.length})
              </span>
            </label>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredValues.map(value => (
              <label key={value} className="flex items-center space-x-3 px-3 py-2.5 hover:bg-blue-50/50 cursor-pointer group transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => handleValueToggle(value)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm flex-1 truncate group-hover:text-blue-700 transition-colors duration-200">
                  {value || <em className="text-slate-400">(empty)</em>}
                </span>
              </label>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm border border-slate-300 rounded-xl hover:bg-white transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilter}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ChefSuiviPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['all-suivi-prestations'],
    queryFn: getAllSuiviPrestations
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileCache] = useState<Map<string, string>>(new Map());

  const filteredAndSortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    let filtered = data;

    if (globalFilter) {
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = getNested(row, col.key);
          return String(value || '').toLowerCase().includes(globalFilter.toLowerCase());
        })
      );
    }

    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(row => {
          const cellValue = String(getNested(row, column) || '');
          return values.includes(cellValue);
        });
      }
    });

    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = getNested(a, sortConfig.key);
        const bVal = getNested(b, sortConfig.key);

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

  const handleViewFile = async (row: SuiviPrestationResponse) => {
    setFileContent(null);
    setShowFileViewer(true);
    const cacheKey = `${row.id}_${row.fichierReceptionTech?.id ?? ''}`;
    if (fileCache.has(cacheKey)) {
      setFileContent(fileCache.get(cacheKey)!);
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/suivi-prestations/${row.id}/reception-tech`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      fileCache.set(cacheKey, blobUrl);
      setFileContent(blobUrl);
    } catch (error) {
      console.error('Error fetching file:', error);
      setFileContent('Erreur lors de la lecture du fichier.');
    }
  };

  const handleDownloadFile = async (row: SuiviPrestationResponse) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/suivi-prestations/${row.id}/reception-tech`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = row.fichierReceptionTech?.name || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement du fichier.');
    }
  };

  const handleFilterChange = (column: string, values: string[]) => {
    setColumnFilters(prev => ({ ...prev, [column]: values }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setGlobalFilter('');
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const formatCellValue = (row: SuiviPrestationResponse, column: Column) => {
    const value = getNested(row, column.key);

    if (column.type === 'file') {
      if (!value || !row.fichierReceptionTech?.id) {
        return <span className="text-slate-400 font-medium">Aucun fichier</span>;
      }
      return (
        <div className="flex items-center gap-3">
          <span className="text-emerald-600 font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            Fichier chargé
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewFile(row)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg transition-all duration-200"
              title="Voir le fichier"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDownloadFile(row)}
              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-1.5 rounded-lg transition-all duration-200"
              title="Télécharger le fichier"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }

    if (value === null || value === undefined || value === '') {
      return (
        <span className="text-red-500 flex items-center gap-2 font-medium">
          <AlertTriangle size={14} className="text-red-400" />
          <span>-</span>
        </span>
      );
    }

    if (column.type === 'date' && value) {
      try {
        return (
          <span className="text-slate-700 font-medium">
            {format(new Date(value), 'dd/MM/yyyy')}
          </span>
        );
      } catch {
        return value;
      }
    }

    if (column.type === 'currency' && typeof value === 'number') {
      return (
        <span className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 px-3 py-1.5 rounded-xl font-semibold">
          {value.toFixed(2)} MAD
        </span>
      );
    }

    if (column.type === 'qty' && typeof value === 'number') {
      return (
        <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1.5 rounded-xl text-sm font-semibold inline-flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          {value}
        </span>
      );
    }

    return <span className="text-slate-700">{String(value)}</span>;
  };

  const activeFiltersCount = Object.values(columnFilters).reduce((acc, filters) => acc + filters.length, 0);

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
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 shadow-sm bg-white/80 backdrop-blur-sm font-medium"
        >
          Previous
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 shadow-sm bg-white/80 backdrop-blur-sm font-medium"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-slate-400 font-medium">...</span>}
          </>
        )}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-4 py-2.5 text-sm border rounded-xl font-medium transition-all duration-200 ${
              page === currentPage
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'border-slate-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 shadow-sm bg-white/80 backdrop-blur-sm'
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-slate-400 font-medium">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 shadow-sm bg-white/80 backdrop-blur-sm font-medium"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 shadow-sm bg-white/80 backdrop-blur-sm font-medium"
        >
          Next
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-slate-700">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 text-xl font-semibold">Erreur: {String(error)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="backdrop-blur-sm bg-white/90 rounded-2xl shadow-2xl border border-white/20 p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              Suivi des Prestations
            </h1>
            <p className="text-slate-600 text-lg">Gérer et filtrer le suivi des prestations avec style</p>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 backdrop-blur-sm">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans toutes les colonnes..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm text-slate-700 font-medium"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-4 py-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm shadow-sm font-medium text-slate-700"
              >
                <option value={5}>5 par page</option>
                <option value={10}>10 par page</option>
                <option value={20}>20 par page</option>
                <option value={50}>50 par page</option>
                <option value={100}>100 par page</option>
              </select>
              <button
                onClick={clearAllFilters}
                className="px-4 py-3.5 border border-slate-200 rounded-xl hover:bg-white/80 backdrop-blur-sm transition-all duration-200 flex items-center gap-2 shadow-sm font-medium text-slate-700 hover:text-red-600 hover:border-red-200"
              >
                <X className="h-4 w-4" />
                Effacer Filtres
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mb-6 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100/50">
            <div className="flex flex-wrap items-center gap-4 text-slate-600">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-semibold text-slate-700">{paginatedData.length}</span> sur{' '}
                <span className="font-semibold text-slate-700">{filteredAndSortedData.length}</span> résultats
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  {activeFiltersCount} filtre{activeFiltersCount !== 1 ? 's' : ''}
                </span>
              )}
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                Page {currentPage} sur {totalPages}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-sm overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-slate-200">
                    {columns.map(col => (
                      <th
                        key={col.key}
                        className="text-left py-5 px-4 font-bold text-slate-700 border-r border-slate-100 min-w-[140px] bg-gradient-to-b from-white/60 to-slate-50/60"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleSort(col.key)}
                            className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200 font-semibold"
                          >
                            <span className="truncate">{col.label}</span>
                            <div className="flex flex-col">
                              <ChevronUp
                                className={`h-3 w-3 transition-colors duration-200 ${
                                  sortConfig?.key === col.key && sortConfig.direction === 'asc'
                                    ? 'text-blue-600'
                                    : 'text-slate-400'
                                }`}
                              />
                              <ChevronDown
                                className={`h-3 w-3 transition-colors duration-200 ${
                                  sortConfig?.key === col.key && sortConfig.direction === 'desc'
                                    ? 'text-blue-600'
                                    : 'text-slate-400'
                                }`}
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
                    paginatedData.map((row: SuiviPrestationResponse, index: number) => (
                      <tr
                        key={row.id || index}
                        className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-slate-100/50 ${
                          index % 2 === 0 ? 'bg-white/30' : 'bg-slate-50/30'
                        }`}
                      >
                        {columns.map(col => (
                          <td
                            key={col.key}
                            className="py-4 px-4 border-r border-slate-100/50"
                          >
                            <div className="max-w-[200px] truncate" title={String(getNested(row, col.key) || '')}>
                              {formatCellValue(row, col)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                          <div className="relative">
                            <Search className="h-12 w-12 text-slate-300" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                              <X className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-slate-700 mb-2">Aucune donnée trouvée</div>
                            <div className="text-sm text-slate-500">Essayez d'ajuster vos filtres ou termes de recherche</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8">
              <div className="text-sm text-slate-600 bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-2 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700">Page {currentPage}</span> sur{' '}
                <span className="font-semibold text-slate-700">{totalPages}</span> •{' '}
                <span className="font-semibold text-slate-700">{filteredAndSortedData.length}</span> résultats au total
              </div>
              {renderPagination()}
            </div>
          )}

          {/* File Viewer Modal */}
          {showFileViewer && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-white/20">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                  <h2 className="text-xl font-bold text-slate-700 flex items-center gap-3">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Visualisation du fichier
                  </h2>
                  <button
                    onClick={() => {
                      setShowFileViewer(false);
                      setFileContent(null);
                    }}
                    className="text-slate-500 hover:text-slate-700 hover:bg-white/60 p-2 rounded-xl transition-all duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6">
                  {fileContent ? (
                    <iframe
                      src={fileContent}
                      className="w-full h-[70vh] border border-slate-200 rounded-xl shadow-inner"
                      title="File Viewer"
                    />
                  ) : (
                    <div className="text-center text-slate-500 py-20">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                      <div className="text-lg font-medium">Chargement...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}