import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, Filter, X, Search, Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ServiceQ {
  id: number;
  famille: { id: number; name: string } | null;
  refAuxigene: string | null;
  description: string;
  unite: string | null;
  type: string | null;
  prix: number;
  remarque: string | null;
  modele_technique: string | null;
  specification: string | null;
  type_materiel: string | null;
  famille_technique: string | null;
}

const Boq: React.FC = () => {
  const [services, setServices] = useState<ServiceQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState<boolean>(false);
  const [isCreateFamilleModalOpen, setIsCreateFamilleModalOpen] = useState<boolean>(false);
  const [newService, setNewService] = useState<Partial<ServiceQ>>({
    description: '',
    prix: 0,
    famille: null,
    refAuxigene: null,
    unite: null,
    type: null,
    remarque: null,
    modele_technique: null,
    specification: null,
    type_materiel: null,
    famille_technique: null,
  });
  const [newFamille, setNewFamille] = useState<string>('');
  const queryClient = useQueryClient();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/services`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch services');
      setServices([]);
      setLoading(false);
    }
  };

  const { data: familles = [], isLoading: loadingFamilles } = useQuery({
    queryKey: ['familles'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/familles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch familles');
      return response.json();
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (service: Partial<ServiceQ>) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...service, famille: service.famille ? { id: service.famille.id } : null }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create service');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsCreateServiceModalOpen(false);
      setNewService({
        description: '',
        prix: 0,
        famille: null,
        refAuxigene: null,
        unite: null,
        type: null,
        remarque: null,
        modele_technique: null,
        specification: null,
        type_materiel: null,
        famille_technique: null,
      });
      fetchServices();
    },
    onError: (error: any) => setError(error.message || 'Failed to create service'),
  });

  const createFamilleMutation = useMutation({
    mutationFn: async (name: string) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/familles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create famille');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familles'] });
      setIsCreateFamilleModalOpen(false);
      setNewFamille('');
    },
    onError: (error: any) => setError(error.message || 'Failed to create famille'),
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceChange = (field: keyof ServiceQ, value: any) => {
    setNewService(prev => ({ ...prev, [field]: value }));
  };

  const handleFamilleChange = (value: string) => {
    setNewFamille(value);
  };

  const handleCreateService = () => {
    if (!newService.description || newService.prix === undefined || newService.prix < 0) {
      setError('Description and valid price are required');
      return;
    }
    createServiceMutation.mutate(newService);
  };

  const handleCreateFamille = () => {
    if (!newFamille.trim()) {
      setError('Famille name is required');
      return;
    }
    createFamilleMutation.mutate(newFamille.trim());
  };

  const ExcelFilter = ({ column, title, data }: { column: string; title: string; data: any[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedValues, setSelectedValues] = useState<string[]>(columnFilters[column] || []);
    const isOpen = openFilter === column;
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
      setColumnFilters(prev => ({ ...prev, [column]: selectedValues }));
      setOpenFilter(null);
    };
    const handleSelectAll = () => {
      setSelectedValues(selectedValues.length === uniqueValues.length ? [] : [...uniqueValues]);
    };
    const handleValueToggle = (value: string) => {
      setSelectedValues(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
    };
    const hasActiveFilter = columnFilters[column]?.length > 0;
    return (
      <div className="relative">
        <button
          onClick={() => setOpenFilter(isOpen ? null : column)}
          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter ? 'bg-blue-100 text-blue-700' : ''}`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilter && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {columnFilters[column].length}
            </span>
          )}
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{title}</span>
                <button
                  onClick={() => {
                    setColumnFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters[column];
                      return newFilters;
                    });
                    setSelectedValues([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search values..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-2 border-b">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.length === uniqueValues.length}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm font-medium">Select All ({uniqueValues.length})</span>
              </label>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredValues.map(value => (
                <label
                  key={value}
                  className="flex items-center space-x-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(value)}
                    onChange={() => handleValueToggle(value)}
                    className="rounded"
                  />
                  <span className="text-sm flex-1 truncate">{value}</span>
                </label>
              ))}
            </div>
            <div className="p-3 border-t flex justify-end space-x-2">
              <button
                onClick={() => setOpenFilter(null)}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyFilter}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = services;
    if (globalFilter) {
      filtered = filtered.filter(service =>
        Object.values(service).some(value =>
          value && typeof value === 'object' && 'name' in value
            ? String(value.name).toLowerCase().includes(globalFilter.toLowerCase())
            : String(value || '').toLowerCase().includes(globalFilter.toLowerCase())
        )
      );
    }
    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(service => {
          const cellValue =
            column === 'famille' && service.famille
              ? String(service.famille.name)
              : String(service[column as keyof ServiceQ] || '');
          return values.includes(cellValue);
        });
      }
    });
    if (sorting) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = sorting.key === 'famille' ? (a.famille?.name || '') : a[sorting.key as keyof ServiceQ];
        const bVal = sorting.key === 'famille' ? (b.famille?.name || '') : b[sorting.key as keyof ServiceQ];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sorting.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sorting.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    return filtered;
  }, [services, globalFilter, columnFilters, sorting]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + pageSize);

  const handleSort = (key: string) => {
    setSorting(prev =>
      prev?.key === key ? (prev.direction === 'asc' ? { key, direction: 'desc' } : null) : { key, direction: 'asc' }
    );
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setGlobalFilter('');
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    if (endPage - startPage + 1 < showPages) startPage = Math.max(1, endPage - showPages + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return (
      <div className="flex items-center justify-center space-x-1">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-2 text-sm border rounded-md ${
              page === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-lg">Loading...</div></div>;
  if (error) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-red-500 text-lg">Error: {error}</div></div>;

  const activeFiltersCount = Object.values(columnFilters).reduce((acc, filters) => acc + filters.length, 0);

  return (
    <div className="p-8 max-w-[98vw] mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bill of Quantities (BOQ)</h1>
            <p className="text-gray-600">Manage and filter your service catalog</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateFamilleModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add New Famille
            </Button>
            <Button onClick={() => setIsCreateServiceModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add New Service
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <X className="h-4 w-4" /> Clear All Filters
            </button>
          </div>
        </div>
        <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
          Showing <span className="font-semibold">{paginatedData.length}</span> of{' '}
          <span className="font-semibold">{filteredAndSortedData.length}</span> filtered results
          {activeFiltersCount > 0 && (
            <span className="ml-2">
              ({activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active)
            </span>
          )}
          <span className="ml-2">• Page {currentPage} of {totalPages}</span>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[80px]">
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleSort('id')} className="flex items-center gap-2 hover:text-blue-600">
                        ID
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[140px]">
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleSort('famille')} className="flex items-center gap-2 hover:text-blue-600">
                        Famille
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                      <ExcelFilter column="famille" title="Famille" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[130px]">
                    <div className="flex items-center justify-between">
                      <span>Ref Auxigene</span>
                      <ExcelFilter column="refAuxigene" title="Ref Auxigene" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <span>Description</span>
                      <ExcelFilter column="description" title="Description" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[100px]">
                    <div className="flex items-center justify-between">
                      <span>Unité</span>
                      <ExcelFilter column="unite" title="Unité" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <span>Type</span>
                      <ExcelFilter column="type" title="Type" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[100px]">
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleSort('prix')} className="flex items-center gap-2 hover:text-blue-600">
                        Prix
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[150px]">
                    <div className="flex items-center justify-between">
                      <span>Remarque</span>
                      <ExcelFilter column="remarque" title="Remarque" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[140px]">
                    <div className="flex items-center justify-between">
                      <span>Marques</span>
                      <ExcelFilter column="modele_technique" title="Modèle Technique" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[130px]">
                    <div className="flex items-center justify-between">
                      <span>Spécification</span>
                      <ExcelFilter column="specification" title="Spécification" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[130px]">
                    <div className="flex items-center justify-between">
                      <span>Type Matériel</span>
                      <ExcelFilter column="type_materiel" title="Type Matériel" data={services} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 min-w-[130px]">
                    <div className="flex items-center justify-between">
                      <span>Famille Technique</span>
                      <ExcelFilter column="famille_technique" title="Famille Technique" data={services} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((service, index) => (
                    <tr key={service.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="py-4 px-6 border-r border-gray-100 font-medium">{service.id}</td>
                      <td className="py-4 px-6 border-r border-gray-100 font-medium">{service.famille?.name ?? '-'}</td>
                      <td className="py-4 px-6 border-r border-gray-100 font-mono text-sm">{service.refAuxigene ?? '-'}</td>
                      <td className="py-4 px-6 border-r border-gray-100 max-w-[200px] truncate" title={service.description}>
                        {service.description}
                      </td>
                      <td className="py-4 px-6 border-r border-gray-100 text-center">
                        <span className="bg-gray-100 px-2 py-1 rounded font-medium">{service.unite ?? '-'}</span>
                      </td>
                      <td className="py-4 px-6 border-r border-gray-100">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.type ?? '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 border-r border-gray-100 text-right font-semibold text-green-700">
                        {service.prix.toFixed(2)}
                      </td>
                      <td
                        className="py-4 px-6 border-r border-gray-100 max-w-[150px] truncate text-gray-600"
                        title={service.remarque || ''}
                      >
                        {service.remarque ?? '-'}
                      </td>
                      <td
                        className="py-4 px-6 border-r border-gray-100 max-w-[140px] truncate font-mono text-sm"
                        title={service.modele_technique || ''}
                      >
                        {service.modele_technique ?? '-'}
                      </td>
                      <td className="py-4 px-6 border-r border-gray-100 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                          {service.specification ?? '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 border-r border-gray-100 font-medium text-gray-700">
                        {service.type_materiel ?? '-'}
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-700">{service.famille_technique ?? '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <span>No results found</span>
                        <span className="text-sm">Try adjusting your filters or search terms</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> •{' '}
              {filteredAndSortedData.length} total results
            </div>
            {renderPagination()}
          </div>
        )}
        <Dialog open={isCreateServiceModalOpen} onOpenChange={setIsCreateServiceModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description *
                </Label>
                <Input
                  id="description"
                  value={newService.description || ''}
                  onChange={(e) => handleServiceChange('description', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prix" className="text-right">
                  Prix *
                </Label>
                <Input
                  id="prix"
                  type="number"
                  value={newService.prix || 0}
                  onChange={(e) => handleServiceChange('prix', Number(e.target.value))}
                  className="col-span-3"
                  min={0}
                  step="0.01"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="famille" className="text-right">
                  Famille
                </Label>
                <Select
                  value={newService.famille?.id?.toString() || 'none'}
                  onValueChange={(value) =>
                    handleServiceChange(
                      'famille',
                      value === 'none'
                        ? null
                        : familles.find((famille: { id: number }) => famille.id.toString() === value) || null
                    )
                  }
                  disabled={loadingFamilles}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select famille" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {familles.map((famille: { id: number; name: string }) => (
                      <SelectItem key={famille.id} value={famille.id.toString()}>
                        {famille.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="refAuxigene" className="text-right">
                  Ref Auxigene
                </Label>
                <Input
                  id="refAuxigene"
                  value={newService.refAuxigene || ''}
                  onChange={(e) => handleServiceChange('refAuxigene', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unite" className="text-right">
                  Unité
                </Label>
                <Input
                  id="unite"
                  value={newService.unite || ''}
                  onChange={(e) => handleServiceChange('unite', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Input
                  id="type"
                  value={newService.type || ''}
                  onChange={(e) => handleServiceChange('type', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="remarque" className="text-right">
                  Remarque
                </Label>
                <Input
                  id="remarque"
                  value={newService.remarque || ''}
                  onChange={(e) => handleServiceChange('remarque', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modele_technique" className="text-right">
                  Modèle Technique
                </Label>
                <Input
                  id="modele_technique"
                  value={newService.modele_technique || ''}
                  onChange={(e) => handleServiceChange('modele_technique', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="specification" className="text-right">
                  Spécification
                </Label>
                <Input
                  id="specification"
                  value={newService.specification || ''}
                  onChange={(e) => handleServiceChange('specification', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type_materiel" className="text-right">
                  Type Matériel
                </Label>
                <Input
                  id="type_materiel"
                  value={newService.type_materiel || ''}
                  onChange={(e) => handleServiceChange('type_materiel', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="famille_technique" className="text-right">
                  Famille Technique
                </Label>
                <Input
                  id="famille_technique"
                  value={newService.famille_technique || ''}
                  onChange={(e) => handleServiceChange('famille_technique', e.target.value || null)}
                  className="col-span-3"
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateServiceModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateService} disabled={createServiceMutation.isPending}>
                {createServiceMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isCreateFamilleModalOpen} onOpenChange={setIsCreateFamilleModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create New Famille</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="famille-name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="famille-name"
                  value={newFamille}
                  onChange={(e) => handleFamilleChange(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateFamilleModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFamille} disabled={createFamilleMutation.isPending}>
                {createFamilleMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Boq;