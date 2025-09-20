import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { getBCs } from './bcApi';
import { getPrestationsByBC } from '../prestation/prestationApi';
import type { BonDeCommande } from './types';
import type { Prestation } from '../prestation/types';
import { useAuth } from '@/features/auth/authContext';
import BCForm from './bcForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationLink } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, Filter, Eye, FileText } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

function safeCellValue(val: unknown): string {
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (Array.isArray(val)) return String(val.length);
  return '-';
}

function BCPrestationsRow({ bcId }: { bcId: string }) {
  const { data: prestations = [], isLoading, error } = useQuery({
    queryKey: ['prestations', bcId],
    queryFn: () => getPrestationsByBC(bcId),
    enabled: !!bcId,
  });
  return (
    <TableRow>
      <TableCell colSpan={7} className="p-0 border-none bg-muted/30">
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-gradient-to-r from-primary to-accent rounded"></div>
                <h4 className="text-lg font-semibold">Prestations liées</h4>
              </div>
              {error ? (
                <div className="text-destructive py-2 text-sm bg-destructive/10 rounded px-3">
                  Erreur de chargement des prestations.
                </div>
              ) : isLoading ? (
                <div className="text-muted-foreground py-4 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  Chargement des prestations...
                </div>
              ) : prestations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table className="w-full text-xs md:text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Prestation</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Num Ligne</TableHead>
                        <TableHead>Quantité Validée</TableHead>
                        <TableHead>Service Description</TableHead>
                        <TableHead>Famille</TableHead>
                        <TableHead>Remarque</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prestations.map((p: Prestation, idx: number) => {
                        if (!p || typeof p !== 'object') return null;
                        return (
                          <TableRow key={typeof p.id === 'string' ? String(p.id) : bcId + '-prest-' + idx}>
                            <TableCell>{p.id || '-'}</TableCell>
                            <TableCell>{p.description || '-'}</TableCell>
                            <TableCell>{p.numLigne || '-'}</TableCell>
                            <TableCell>{p.qteBc || '-'}</TableCell>
                            <TableCell>{p.service?.description || '-'}</TableCell>
                            <TableCell>{p.famille || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-muted-foreground py-4 text-center bg-muted/30 rounded-lg">
                  Aucune prestation liée.
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </TableCell>
    </TableRow>
  );
}

function getUniqueValueCounts(arr: any[], key: string) {
  const counts: Record<string, number> = {};
  arr.forEach(row => {
    const val = String(row[key] ?? '');
    if (val in counts) counts[val]++;
    else counts[val] = 1;
  });
  return counts;
}

export default function BCList() {
  const [showAddBCForm, setShowAddBCForm] = useState(false);
  const [editingBC, setEditingBC] = useState<BonDeCommande | null>(null);
  const [expandedBC, setExpandedBC] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof BonDeCommande; direction: 'asc' | 'desc' } | null>(null);
  const [filterPopover, setFilterPopover] = useState<keyof BonDeCommande | null>(null);
  const [filterSearch, setFilterSearch] = useState<Record<string, string>>({});
  const [multiFilter, setMultiFilter] = useState<Record<string, string[]>>({});
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);

  const { user } = useAuth();

  const { data: bcs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['bcs', user?.email],
    queryFn: () => user?.email ? getBCs(user.email) : Promise.resolve([]),
    enabled: !!user?.email,
  });

  // Pagination logic
  const total = Array.isArray(bcs) ? bcs.length : 0;
  const pageCount = Math.ceil(total / perPage);

  // Filtering logic
  const filteredBCs = Array.isArray(bcs)
    ? bcs.filter(bc =>
        Object.entries(multiFilter).every(([key, values]) => {
          if (!values || values.length === 0) return true;
          return values.includes(String(bc[key] ?? ''));
        })
      )
    : [];

  // Sorting
  const sortedBCs = sortConfig && filteredBCs.length > 0
    ? [...filteredBCs].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof BonDeCommande];
        const bVal = b[sortConfig.key as keyof BonDeCommande];
        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (sortConfig.direction === 'asc') {
          return String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        } else {
          return String(bVal).localeCompare(String(aVal), undefined, { numeric: true });
        }
      })
    : filteredBCs;

  const paginatedBCs = sortedBCs.slice((page - 1) * perPage, page * perPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pageCount) setPage(newPage);
  };

  const handlePerPageChange = (val: string) => {
    setPerPage(Number(val));
    setPage(1);
  };

  const handleAdd = () => {
    setShowAddBCForm(false);
    refetch();
  };

  const handleEdit = (bc: BonDeCommande) => {
    setEditingBC(bc);
  };

  const handleDelete = async (bcId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce Bon de Commande ?')) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        await fetch(`${apiUrl}/bon-de-commande/${bcId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        refetch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleViewFile = async (bc: BonDeCommande) => {
    setFileContent(null);
    setShowFileViewer(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/bon-de-commande/${bc.numBc}/file`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setFileContent('Aucun fichier attaché à ce Bon de Commande.');
        } else {
          setFileContent('Erreur lors de la récupération du fichier.');
        }
        return;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setFileContent(blobUrl);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      setFileContent('Erreur lors de la lecture du fichier.');
    }
  };

  const tableColumns = [
    { key: 'numBc', label: 'Num BC' },
    { key: 'divisionProjet', label: 'Division Projet' },
    { key: 'codeProjet', label: 'Code Projet' },
    { key: 'dateEdition', label: 'Date Édition' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-8">
        Erreur lors du chargement des Bons de Commande
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full p-7">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bons de Commande</h2>
        <Dialog open={showAddBCForm} onOpenChange={setShowAddBCForm}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setShowAddBCForm(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Plus size={20} className="mr-2" />
              Ajouter BC
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-none w-[98vw] max-h-[95vh] overflow-hidden bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl scale-90 origin-center !p-0">
            <div className="p-6">
              <DialogHeader className="pb-6 border-b border-border/20">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <Plus size={20} className="text-white" />
                  </div>
                  Ajouter un Bon de Commande
                </DialogTitle>
                <p className="text-muted-foreground text-sm mt-2">
                  Créez un nouveau bon de commande en remplissant les informations ci-dessous
                </p>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[calc(95vh-140px)] pr-2 px-1">
                <BCForm onSuccess={() => { setShowAddBCForm(false); handleAdd(); }} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Éléments par page:</span>
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50, 100].map(n => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => handlePageChange(page - 1)} aria-disabled={page === 1} />
            </PaginationItem>
            {Array.from({ length: pageCount }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink isActive={page === i + 1} onClick={() => handlePageChange(i + 1)}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => handlePageChange(page + 1)} aria-disabled={page === pageCount} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {editingBC && (
        <Dialog open={!!editingBC} onOpenChange={open => { if (!open) setEditingBC(null); }}>
          <DialogContent className="!max-w-none w-[98vw] max-h-[95vh] overflow-hidden bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl scale-90 origin-center !p-0">
            <div className="p-6">
              <DialogHeader className="pb-6 border-b border-border/20">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <Pencil size={20} className="text-white" />
                  </div>
                  Modifier le Bon de Commande
                </DialogTitle>
                <p className="text-muted-foreground text-sm mt-2">
                  Modifiez les informations du bon de commande ci-dessous
                </p>
              </DialogHeader>
              <div className="overflow-y-auto max-h-[calc(95vh-140px)] pr-2 px-1">
                <BCForm
                  onSuccess={() => { setEditingBC(null); refetch(); }}
                  initialData={editingBC}
                  isEditMode
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Card className="overflow-x-auto w-full max-w-full p-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full max-w-full">
            <Table className="w-full min-w-[900px] text-xs md:text-sm">
              <TableHeader>
                <TableRow>
                  {tableColumns.map(col => (
                    <TableHead key={col.key} className="font-semibold uppercase tracking-wider relative group">
                      <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => {
                        setSortConfig(s =>
                          s && s.key === col.key
                            ? { key: col.key, direction: s.direction === 'asc' ? 'desc' : 'asc' }
                            : { key: col.key, direction: 'asc' }
                        );
                      }}>
                        {col.label}
                        <span className="flex flex-col text-xs">
                          <ChevronUp className={sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-primary' : 'text-muted-foreground'} size={14} />
                          <ChevronDown className={sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-primary' : 'text-muted-foreground'} size={14} />
                        </span>
                        <Popover open={filterPopover === col.key} onOpenChange={open => setFilterPopover(open ? col.key as keyof BonDeCommande : null)}>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="ml-1 p-1 h-6 w-6"><Filter size={14} /></Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2">
                            <div className="mb-2 flex items-center gap-2">
                              <Input
                                value={filterSearch[col.key] || ''}
                                onChange={e => setFilterSearch(f => ({ ...f, [col.key]: e.target.value }))}
                                placeholder={`Rechercher...`}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {Object.entries(getUniqueValueCounts(filteredBCs, col.key as string))
                                .filter(([val]) => (filterSearch[col.key] ? val.toLowerCase().includes(filterSearch[col.key].toLowerCase()) : true))
                                .sort((a, b) => a[0].localeCompare(b[0]))
                                .map(([val, count]) => (
                                  <label key={val} className="flex items-center gap-2 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-accent/20">
                                    <Checkbox
                                      checked={multiFilter[col.key]?.includes(val) || false}
                                      onCheckedChange={checked => {
                                        setMultiFilter(f => {
                                          const prev = f[col.key] || [];
                                          if (checked) return { ...f, [col.key]: [...prev, val] };
                                          else return { ...f, [col.key]: prev.filter(v => v !== val) };
                                        });
                                      }}
                                    />
                                    <span className="flex-1 truncate">{val || <span className="italic text-muted-foreground">(vide)</span>}</span>
                                    <span className="text-muted-foreground">({count})</span>
                                  </label>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 gap-2">
                              <Button size="sm" variant="outline" className="w-1/2" onClick={() => setMultiFilter(f => ({ ...f, [col.key]: [] }))}>Tout effacer</Button>
                              <Button size="sm" variant="secondary" className="w-1/2" onClick={() => setFilterPopover(null)}>Fermer</Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="font-semibold uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBCs.length > 0 && paginatedBCs.every(bc => typeof bc === 'object') ? (
                  paginatedBCs.map((bc) => {
                    if (!bc || typeof bc !== 'object') return null;
                    const bcId = String(bc?.numBc);
                    const isExpanded = expandedBC === bcId;
                    return (
                      <React.Fragment key={bcId}>
                        <TableRow
                          key={bcId}
                          className="cursor-pointer group hover:bg-accent/30 transition-all"
                          onClick={() => setExpandedBC(isExpanded ? null : bcId)}
                        >
                          {tableColumns.map((col) => (
                            <TableCell key={col.key} className="py-2 px-4 font-medium">
                              {safeCellValue(bc[col.key]) as React.ReactNode}
                            </TableCell>
                          ))}
                          <TableCell className="text-center py-2 px-4">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(bc);
                                }}
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFile(bc);
                                }}
                                title="Voir le fichier attaché"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(bcId);
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && <BCPrestationsRow bcId={bcId} />}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      Aucun Bon de Commande trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showFileViewer && (
        <Dialog open={showFileViewer} onOpenChange={(open) => {
          setShowFileViewer(open);
          if (!open && fileContent && fileContent.startsWith('blob:')) {
            URL.revokeObjectURL(fileContent);
            setFileContent(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Fichier attaché</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {fileContent ? (
                typeof fileContent === 'string' && (fileContent.startsWith('data:') || fileContent.startsWith('blob:')) ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm text-muted-foreground">Fichier attaché</span>
                    </div>
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <iframe 
                        src={fileContent} 
                        className="w-full h-[60vh] border-0"
                        title="Fichier attaché"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{fileContent}</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Chargement du fichier...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}