import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, Filter, X, Search, Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Site {
  id: number;
  codesite: string;
  zone: { id: number; nom: string } | null;
  region: string;
}

const Sites: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState<boolean>(false);
  const [newSite, setNewSite] = useState<Partial<Site>>({
    codesite: '',
    zone: null,
    region: '',
  });
  const queryClient = useQueryClient();

  const { data: sitesData = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/site`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch sites');
      return response.json();
    },
  });

  useEffect(() => {
    if (!isLoading) {
      setSites(Array.isArray(sitesData) ? sitesData : []);
      setLoading(false);
    }
  }, [sitesData, isLoading]);

  const createSiteMutation = useMutation({
    mutationFn: async (site: Partial<Site>) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/site`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          codesite: site.codesite,
          zoneId: site.zone?.id,
          region: site.region,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create site');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsCreateSiteModalOpen(false);
      setNewSite({ codesite: '', zone: null, region: '' });
    },
    onError: (error: any) => setError(error.message || 'Failed to create site'),
  });

  const zones = useMemo(() => {
    const zoneList = sites
      .filter(site => site.zone)
      .map(site => site.zone!)
      .reduce((acc, zone) => {
        if (!acc.find(z => z.id === zone.id)) acc.push(zone);
        return acc;
      }, [] as { id: number; nom: string }[]);
    return zoneList.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [sites]);

  const handleSiteChange = (field: keyof Site, value: any) => {
    setNewSite(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateSite = () => {
    if (!newSite.codesite || !newSite.zone?.id || !newSite.region) {
      setError('Codesite, Zone, and Region are required');
      return;
    }
    createSiteMutation.mutate(newSite);
  };

  const ExcelFilter = ({ column, title, data }: { column: string; title: string; data: any[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedValues, setSelectedValues] = useState<string[]>(columnFilters[column] || []);
    const isOpen = openFilter === column;
    const uniqueValues = useMemo(() => {
      const values = data
        .map(row => (column === 'zone' && row.zone ? row.zone.nom : row[column]))
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
    let filtered = sites;
    if (globalFilter) {
      filtered = filtered.filter(site =>
        Object.values(site).some(value =>
          value && typeof value === 'object' && 'nom' in value
            ? String(value.nom).toLowerCase().includes(globalFilter.toLowerCase())
            : String(value || '').toLowerCase().includes(globalFilter.toLowerCase())
        )
      );
    }
    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(site => {
          const cellValue =
            column === 'zone' && site.zone
              ? String(site.zone.nom)
              : String(site[column as keyof Site] || '');
          return values.includes(cellValue);
        });
      }
    });
    if (sorting) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = sorting.key === 'zone' ? (a.zone?.nom || '') : a[sorting.key as keyof Site];
        const bVal = sorting.key === 'zone' ? (b.zone?.nom || '') : b[sorting.key as keyof Site];
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
  }, [sites, globalFilter, columnFilters, sorting]);

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sites</h1>
            <p className="text-gray-600">Manage and filter your site catalog</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateSiteModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add New Site
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
                      <button onClick={() => handleSort('codesite')} className="flex items-center gap-2 hover:text-blue-600">
                        Code Site
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                      <ExcelFilter column="codesite" title="Code Site" data={sites} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[140px]">
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleSort('zone')} className="flex items-center gap-2 hover:text-blue-600">
                        Zone
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                      <ExcelFilter column="zone" title="Zone" data={sites} />
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 border-r border-gray-200 min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <button onClick={() => handleSort('region')} className="flex items-center gap-2 hover:text-blue-600">
                        Region
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                      <ExcelFilter column="region" title="Region" data={sites} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((site, index) => (
                    <tr key={site.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="py-4 px-6 border-r border-gray-100 font-medium">{site.id}</td>
                      <td className="py-4 px-6 border-r border-gray-100 font-mono text-sm">{site.codesite}</td>
                      <td className="py-4 px-6 border-r border-gray-100">{site.zone?.nom ?? '-'}</td>
                      <td className="py-4 px-6 border-r border-gray-100">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {site.region}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-gray-500">
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
        <Dialog open={isCreateSiteModalOpen} onOpenChange={setIsCreateSiteModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Create New Site</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codesite" className="text-right">
                  Code Site *
                </Label>
                <Input
                  id="codesite"
                  value={newSite.codesite || ''}
                  onChange={(e) => handleSiteChange('codesite', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="zone" className="text-right">
                  Zone *
                </Label>
                <Select
                  value={newSite.zone?.id?.toString() || ''}
                  onValueChange={(value) =>
                    handleSiteChange(
                      'zone',
                      value ? zones.find(zone => zone.id.toString() === value) || null : null
                    )
                  }
                  disabled={zones.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>
                        {zone.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="region" className="text-right">
                  Region *
                </Label>
                <Select
                  value={newSite.region || ''}
                  onValueChange={(value) => handleSiteChange('region', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nord">Nord</SelectItem>
                    <SelectItem value="sud">Sud</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateSiteModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSite} disabled={createSiteMutation.isPending}>
                {createSiteMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Sites;