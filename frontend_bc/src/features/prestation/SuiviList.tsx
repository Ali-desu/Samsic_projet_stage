import { useQuery } from '@tanstack/react-query';
import { getAllSuiviPrestationsByBackOfficeEmail } from '@/features/bon_de_commande/bcApi';
import { ChevronUp, ChevronDown, X, Filter, Search, AlertTriangle, Eye, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { useAuth } from '../auth/authContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';

// Interfaces
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
  description?: string;
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
  site : string;
  dateEdition: string;
  fichierReceptionTech: FileResponse | null;
  error: string | null;
}

interface ServiceQ {
  id: number;
  famille: { id: number; name: string };
  description: string;
  prix: number;
}

interface OTPrestation {
  id: number;
  numLigne: number;
  quantiteValide: number;
  service: ServiceQ | null;
  famille: string;
  coordinateur: string | null;
  fichierReceptionTech: FileResponse | null;
  fournisseur: string | null;
  datePlanifiee: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateRealisation: string | null;
  statutDeRealisation: string | null;
  dateRecepTech: string | null;
  statutDeRecepTech: string | null;
  datePf: string | null;
  dateRecepSys: string | null;
  statutReceptionSystem: string | null;
  remarque: string;
  qteValide: number;
  delaiRecep: number | null;
}

interface OTResponse {
  numOt: string;
  divisionProjet: string;
  codeProjet: string;
  zone: {
    id: number;
    nom: string;
  };
  dateGo: string;
  codeSite: {
    id: number;
    codesite: string;
    zone: {
      id: number;
      nom: string;
    };
    region: string;
  };
  backOfficeId: number;
  prestations: OTPrestation[];
}

// Common display row interface
interface DisplayRow extends Omit<SuiviPrestationResponse, 'codesite' | 'id'> {
  site: string;
  id: number | string; // id can be number (for BC) or string (for OT)
}

// Columns
interface Column {
  key: string;
  label: string;
  type?: 'currency' | 'qty' | 'date' | 'file';
}

const columns: Column[] = [
  { key: 'bc_num', label: 'BC/OT Num' },
  { key: 'prestation.numLigne', label: 'Num Ligne' },
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

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const fetchOTs = async (email: string): Promise<OTResponse[]> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const response = await axios.get(`${apiUrl}/ots/${encodeURIComponent(email)}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching OTs:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch OTs');
  }
};

const ExcelFilter: React.FC<{
  column: string;
  title: string;
  data: DisplayRow[];
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
        className={`p-1 rounded-md hover:bg-accent transition-all duration-200 ${hasActiveFilter ? 'bg-primary/10 text-primary shadow-sm' : ''}`}
      >
        <Filter className="h-4 w-4" />
        {hasActiveFilter && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {filters[column].length}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-md z-50">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-foreground">{title}</span>
              <button
                onClick={() => {
                  onFilterChange(column, []);
                  setSelectedValues([]);
                }}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors duration-200"
              >
                Clear
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <div className="p-2 border-b border-border">
            <label className="flex items-center space-x-2 cursor-pointer hover:bg-accent rounded-md p-1 transition-colors duration-200">
              <input
                type="checkbox"
                checked={selectedValues.length === uniqueValues.length}
                onChange={handleSelectAll}
                className="rounded text-primary focus:ring-ring"
              />
              <span className="text-sm font-medium text-foreground">
                Select All ({uniqueValues.length})
              </span>
            </label>
          </div>
          <div className="max-h-48 overflow-y-auto scrollbar-thin">
            {filteredValues.map(value => (
              <label key={value} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent cursor-pointer transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => handleValueToggle(value)}
                  className="rounded text-primary focus:ring-ring"
                />
                <span className="text-sm flex-1 truncate text-foreground">
                  {value || <em className="text-muted-foreground">(empty)</em>}
                </span>
              </label>
            ))}
          </div>
          <div className="p-3 border-t border-border flex justify-end space-x-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilter}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200"
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
  const auth = useAuth();
  const userEmail = auth?.user?.email;
  const [view, setView] = useState<'suivis' | 'ots'>('suivis');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileCache] = useState<Map<string, string>>(new Map());

  const { data: suiviPrestations = [], isLoading: isLoadingBCs, error: errorBCs } = useQuery<SuiviPrestationResponse[], Error>({
    queryKey: ['all-suivi-prestations', userEmail],
    queryFn: ({ queryKey }) => {
      const email = queryKey[1] as string | undefined;
      if (!email) return Promise.resolve([]);
      return getAllSuiviPrestationsByBackOfficeEmail(email);
    },
    enabled: !!userEmail,
  });

  const { data: ots = [], isLoading: isLoadingOTs, error: errorOTs } = useQuery<OTResponse[], Error>({
    queryKey: ['ots', userEmail],
    queryFn: () => {
      if (!userEmail) return Promise.resolve([]);
      return fetchOTs(userEmail);
    },
    enabled: !!userEmail,
  });

  // Prepare BC data
  const bcData = useMemo((): DisplayRow[] => {
    return suiviPrestations.map(item => ({
      ...item,
      site: item.site || '',
      id: item.id,
    }));
  }, [suiviPrestations]);

  // Prepare OT data
  const otData = useMemo((): DisplayRow[] => {
    return ots.flatMap(ot =>
      ot.prestations.map(prestation => ({
        id: `ot-${prestation.id}`,
        bc_num: ot.numOt,
        prestation: {
          id: `p-${prestation.id}`,
          numLigne: prestation.numLigne,
          description: prestation.service?.description || '',
          qteBc: prestation.quantiteValide || 0,
          famille: prestation.service?.famille.name || '',
          zone: {
            id: ot.zone.id,
            name: ot.zone.nom || '',
          },
          service: prestation.service
            ? {
                id: prestation.service.id,
                nomService: prestation.service.description || 'Unknown Service', // Map 'description' to 'nomService'
                prix: prestation.service.prix || 0,
                description: prestation.service.description, // Optional field
              }
            : {
                id: 0,
                nomService: 'Unknown Service',
                prix: 0,
              },
        },
        coordinateurId: 0,
        zone: {
          id: ot.zone.id,
          name: ot.zone.nom || '',
        },
        qteRealise: prestation.qteValide || 0,
        qteEncours: 0,
        qteTech: 0,
        qteDepose: 0,
        qteADepose: 0,
        qteSys: 0,
        fournisseur: prestation.fournisseur || '',
        datePlanifiee: prestation.datePlanifiee,
        dateGo: ot.dateGo,
        dateDebut: prestation.dateDebut,
        dateFin: prestation.dateFin,
        dateRealisation: prestation.dateRealisation,
        statutDeRealisation: prestation.statutDeRealisation,
        dateRecepTech: prestation.dateRecepTech,
        statutReceptionTech: prestation.statutDeRecepTech,
        datePf: prestation.datePf,
        dateRecepSys: prestation.dateRecepSys,
        statutReceptionSystem: prestation.statutReceptionSystem,
        remarque: prestation.remarque,
        delaiRecep: prestation.delaiRecep || 0,
        site: ot.codeSite?.codesite || '',
        dateEdition: ot.dateGo,
        fichierReceptionTech: prestation.fichierReceptionTech,
        error: null,
      }))
    );
  }, [ots]);

  const currentData = view === 'suivis' ? bcData : otData;
  const isLoading = view === 'suivis' ? isLoadingBCs : isLoadingOTs;
  const error = view === 'suivis' ? errorBCs : errorOTs;

  const filteredAndSortedData = useMemo(() => {
    let filtered = currentData;

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
  }, [currentData, globalFilter, columnFilters, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + pageSize);

  const handleViewFile = async (row: DisplayRow) => {
    if (!row.fichierReceptionTech?.id) {
      setFileContent('Aucun fichier disponible.');
      setShowFileViewer(true);
      return;
    }

    setFileContent(null);
    setShowFileViewer(true);
    const cacheKey = `${view}-${row.id}-${row.fichierReceptionTech.id}`;
    if (fileCache.has(cacheKey)) {
      setFileContent(fileCache.get(cacheKey)!);
      return;
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const endpoint = view === 'suivis' 
        ? `/suivi-prestations/${row.id}/reception-tech` 
        : `/ots/prestations/${row.id}/reception-tech`;
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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

  const handleDownloadFile = async (row: DisplayRow) => {
    if (!row.fichierReceptionTech?.id) {
      alert('Aucun fichier à télécharger.');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const endpoint = view === 'suivis' 
        ? `/suivi-prestations/${row.id}/reception-tech` 
        : `/ots/prestations/${row.id}/reception-tech`;
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = row.fichierReceptionTech.name || 'file';
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

  const formatCellValue = (row: DisplayRow, column: Column) => {
    const value = getNested(row, column.key);

    if (column.type === 'file') {
      if (!value || !row.fichierReceptionTech?.id) {
        return <span className="text-muted-foreground">N/A</span>;
      }
      return (
        <div className="flex items-center gap-2">
          <span className="text-primary">Fichier chargé</span>
          <button
            onClick={() => handleViewFile(row)}
            className="text-primary hover:text-primary/80"
            title="Voir le fichier"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDownloadFile(row)}
            className="text-primary hover:text-primary/80"
            title="Télécharger le fichier"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-destructive flex items-center gap-1"><AlertTriangle size={14} />-</span>;
    }

    if (column.type === 'date' && value) {
      try {
        return format(new Date(value), 'dd/MM/yyyy');
      } catch {
        return value;
      }
    }

    if (column.type === 'currency' && typeof value === 'number') {
      return (
        <span className="bg-accent text-accent-foreground px-2 py-1 rounded-md text-sm font-medium">
          {value.toFixed(2)} MAD
        </span>
      );
    }

    if (column.type === 'qty' && typeof value === 'number') {
      return (
        <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
          {value}
        </span>
      );
    }

    return String(value);
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
      <div className="flex items-center justify-center space-x-1">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          size="sm"
        >
          Previous
        </Button>
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(1)}
              size="sm"
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
          </>
        )}
        {pages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            onClick={() => setCurrentPage(page)}
            size="sm"
          >
            {page}
          </Button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-muted-foreground">...</span>}
            <Button
              variant="outline"
              onClick={() => setCurrentPage(totalPages)}
              size="sm"
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          size="sm"
        >
          Next
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-semibold text-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center bg-card p-8 rounded-lg shadow-md border border-border">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <div className="text-xl font-semibold text-destructive mb-2">Erreur</div>
          <div className="text-muted-foreground mb-4">{String(error)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[98vw] mx-auto bg-background min-h-screen">
      <div className="space-y-6">
        <div className="card bg-card rounded-lg shadow-sm p-6 border border-border">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Suivi des Prestations</h1>
            <p className="text-muted-foreground">Gérer et filtrer le suivi des prestations et ordres de travail</p>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              variant={view === 'suivis' ? 'default' : 'outline'}
              onClick={() => setView('suivis')}
            >
              Suivis BC
            </Button>
            <Button
              variant={view === 'ots' ? 'default' : 'outline'}
              onClick={() => setView('ots')}
            >
              Ordres de Travail (OT)
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher dans toutes les colonnes..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
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
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
              >
                <option value={5}>5 par page</option>
                <option value={10}>10 par page</option>
                <option value={20}>20 par page</option>
                <option value={50}>50 par page</option>
                <option value={100}>100 par page</option>
              </select>
              <Button
                variant="outline"
                onClick={clearAllFilters}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Effacer Filtres
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm text-muted-foreground">
              Affichage de <span className="font-semibold text-foreground">{paginatedData.length}</span> sur{' '}
              <span className="font-semibold text-foreground">{filteredAndSortedData.length}</span> résultats filtrés
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                  {activeFiltersCount} filtre{activeFiltersCount !== 1 ? 's' : ''} actif{activeFiltersCount !== 1 ? 's' : ''}
                </span>
              )}
              <span className="ml-2">• Page {currentPage} sur {totalPages}</span>
            </div>
          </div>

          <div className="card bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1600px]">
                <thead>
                  <tr className="bg-muted border-b-2 border-border">
                    {columns.map(col => (
                      <th
                        key={col.key}
                        className={`text-left py-4 px-4 font-semibold text-foreground border-r border-border min-w-[140px] ${
                          col.type === 'qty'
                            ? 'bg-primary/5'
                            : col.type === 'currency'
                            ? 'bg-accent/5'
                            : col.type === 'file'
                            ? 'bg-destructive/5'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleSort(col.key)}
                            className="flex items-center gap-2 hover:text-primary transition-colors duration-200"
                          >
                            <span className="truncate">{col.label}</span>
                            <div className="flex flex-col">
                              <ChevronUp
                                className={`h-3 w-3 transition-colors duration-200 ${
                                  sortConfig?.key === col.key && sortConfig.direction === 'asc'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }`}
                              />
                              <ChevronDown
                                className={`h-3 w-3 transition-colors duration-200 ${
                                  sortConfig?.key === col.key && sortConfig.direction === 'desc'
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            </div>
                          </button>
                          <ExcelFilter
                            column={col.key}
                            title={col.label}
                            data={currentData}
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
                        key={row.id}
                        className={`hover:bg-accent transition-all duration-200 border-b border-border ${
                          index % 2 === 0 ? 'bg-card' : 'bg-muted/50'
                        }`}
                      >
                        {columns.map(col => (
                          <td
                            key={col.key}
                            className={`py-3 px-4 border-r border-border ${
                              col.type === 'qty'
                                ? 'bg-primary/5'
                                : col.type === 'currency'
                                ? 'bg-accent/5'
                                : col.type === 'file'
                                ? 'bg-destructive/5'
                                : ''
                            }`}
                          >
                            <div
                              className="max-w-[200px] truncate"
                              title={String(getNested(row, col.key) || '')}
                            >
                              {formatCellValue(row, col)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                          <Search className="h-12 w-12 text-muted-foreground" />
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
            <div className="card bg-card rounded-lg shadow-sm p-6 border border-border">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {renderPagination()}
                <div className="text-sm text-muted-foreground">
                  Afficher{' '}
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>{' '}
                  par page
                </div>
              </div>
            </div>
          )}

          {showFileViewer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-auto border border-border shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Visualisation du fichier</h2>
                  <button
                    onClick={() => {
                      setShowFileViewer(false);
                      setFileContent(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {fileContent ? (
                  <iframe
                    src={fileContent}
                    className="w-full h-[70vh] border border-border"
                    title="File Viewer"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">Chargement...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}