import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuiviPrestationsByEmail } from './prestationApi';
import { useAuth } from '@/features/auth/authContext';
import { ChevronUp, ChevronDown, Filter, Search, Pencil, AlertTriangle, Upload, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { format, isBefore } from 'date-fns';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interfaces
interface Row {
  id: string;
  numLigne: any;
  coordinateur: any;
  dateRecepSys: any;
  bc_num: string;
  zone: { id: string; nom: string };
  site: string;
  fournisseur: string;
  prestation: {
    famille: string;
    description: string;
    service: {
      prix: number;
      id?: number;
      nomService?: string;
      famille?: { name: string };
    };
  };
  datePlanifiee?: string;
  dateGo?: string;
  dateRealisation?: string;
  qteRealise: number;
  qteEncours: number;
  qteTech: number;
  qteDepose: number;
  qteADepose: number;
  qteSys: number;
  dateEdition?: string;
  dateDebut?: string;
  dateFin?: string;
  statutDeRealisation: string;
  dateRecepTech?: string;
  statutReceptionTech: string;
  datePf?: string;
  statutReceptionSystem: string;
  remarque?: string;
  delaiRecep?: string;
  fichierReceptionTech?: { id: number; name: string; contentType: string };
  isOt?: boolean;
  numOt?: string;
}

interface Column {
  key: keyof Row | string;
  label: string;
  type?: 'id' | 'date' | 'qty' | 'currency';
}

interface Ot {
  coordinateur: string;
  numOt: string;
  divisionProjet?: string;
  codeProjet?: string;
  zone?: { id: string; nom: string };
  dateGo?: string;
  codeSite?: {
    id: number;
    codesite: string;
    zone: { id: number; nom: string };
    region: string;
  };
  backOffice?: { id: number };
  prestations: OtPrestation[];
}

interface OtPrestation {
  qteEncours: number;
  qteTech: number;
  qteDepose: number;
  qteADepose: number;
  qteSys: number;
  fichierReceptionTech: any;
  id: number;
  numLigne?: number;
  quantiteValide?: number;
  qteRealise?: number;
  service?: { id: number; nomService?: string; prix?: number; description?: string; famille?: { id: number; name: string } };
  famille?: string;
  remarque?: string;
  coordinateur?: { id: number };
  fournisseur?: string;
  datePlanifiee?: string;
  dateDebut?: string;
  dateFin?: string;
  dateRealisation?: string;
  statutDeRealisation?: string;
  dateRecepTech?: string;
  statutDeRecepTech?: string;
  datePf?: string;
  dateRecepSys?: string;
  statutReceptionSystem?: string;
  delaiRecep?: number;
}

// Helper Functions
const columns: Column[] = [
  { key: 'select', label: '' },
  { key: 'id', label: 'ID', type: 'id' },
  { key: 'bc_num', label: 'N° de BC' },
  { key: 'zone.nom', label: 'Zone' },
  { key: 'site', label: 'Site' },
  { key: 'fournisseur', label: 'Fournisseur' },
  { key: 'prestation.service.famille.name', label: 'Famille' },
  { key: 'prestation.description', label: 'Description' },
  { key: 'qteRealise', label: 'Quantité Réalisée', type: 'qty' },
  { key: 'qteEncours', label: 'Quantité En Cours', type: 'qty' },
  { key: 'qteTech', label: 'Quantité Tech', type: 'qty' },
  { key: 'qteDepose', label: 'Quantité Déposé', type: 'qty' },
  { key: 'qteADepose', label: 'Quantité À Déposer', type: 'qty' },
  { key: 'qteSys', label: 'Quantité Système', type: 'qty' },
  { key: 'datePlanifiee', label: 'Date Planifiée', type: 'date' },
  { key: 'dateGo', label: 'Date GO', type: 'date' },
  { key: 'dateDebut', label: 'Date Début', type: 'date' },
  { key: 'dateFin', label: 'Date Fin', type: 'date' },
  { key: 'statutDeRealisation', label: 'Statut Réalisation' },
  { key: 'dateRecepTech', label: 'Date Réception Tech', type: 'date' },
  { key: 'datePf', label: 'Date PF', type: 'date' },
  { key: 'prestation.service.prix', label: 'Prix Unitaire', type: 'currency' },
  { key: 'montantTotal', label: 'Montant Total', type: 'currency' },
  { key: 'statutReceptionTech', label: 'Statut Réception Tech' },
  { key: 'remarque', label: 'Remarque' },
  { key: 'delaiRecep', label: 'Délai Réception' },
  { key: 'fichierReceptionTech.name', label: 'Fichier Réception' },
  { key: 'actions', label: 'Actions' },
];

function getNested(obj: any, path: string): any {
  const value = path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  return value;
}

function setNested(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  const last = parts.pop();
  let curr = obj;
  for (const part of parts) {
    if (!(part in curr)) curr[part] = {};
    curr = curr[part];
  }
  if (last) curr[last] = value === '' ? null : value;
}

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const getOtsByEmail = async (email: string): Promise<Ot[]> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${apiUrl}/ots/${email}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
  if (!response.ok) throw new Error('Failed to fetch OTs');
  return response.json();
};

// Components
const ExcelFilter: React.FC<{
  column: string;
  title: string;
  data: Row[];
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
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilter && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {filters[column].length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{title}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onFilterChange(column, []);
                  setSelectedValues([]);
                }}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Effacer
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredValues.map(value => (
              <label key={value} className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-accent/20">
                <Checkbox
                  checked={selectedValues.includes(value)}
                  onCheckedChange={() => handleValueToggle(value)}
                />
                <span className="flex-1 truncate">{value || <span className="italic text-muted-foreground">(vide)</span>}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-2 gap-2">
            <Button size="sm" variant="outline" className="w-1/2 text-sm" onClick={handleSelectAll}>
              Tout sélectionner
            </Button>
            <Button size="sm" variant="secondary" className="w-1/2 text-sm" onClick={handleApplyFilter}>
              Appliquer
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const EditSuiviModal: React.FC<{
  row: Row | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: Row) => void;
  onViewFile: (row: Row) => void;
}> = ({ row, open, onClose, onSave, onViewFile }) => {
  const [form, setForm] = useState<Row | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  React.useEffect(() => {
    if (row) {
      setForm({
        ...row,
        id: row.id,
        statutDeRealisation: row.statutDeRealisation || 'Planifié',
        statutReceptionTech: row.statutReceptionTech || 'En cours',
        statutReceptionSystem: row.statutReceptionSystem || 'En cours',
        delaiRecep: row.delaiRecep || '',
        remarque: row.remarque || '',
        fournisseur: row.fournisseur || '',
        qteRealise: row.qteRealise || 0,
        qteEncours: row.qteEncours || 0,
        qteTech: row.qteTech || 0,
        qteDepose: row.qteDepose || 0,
        qteADepose: row.qteADepose || 0,
        qteSys: row.qteSys || 0,
        fichierReceptionTech: row.fichierReceptionTech || undefined,
      });
      setFile(null);
      setError(null);
    } else {
      setForm(null);
      setFile(null);
      setError(null);
    }
  }, [row]);

  const handleChange = (key: string, value: any) => {
    if (key === 'id') return;
    setForm(f => {
      if (!f) return f;
      const updated = { ...f };
      setNested(updated, key, value === '' ? null : value);
      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const uploadFileMutation = useMutation({
    mutationFn: async () => {
      if (!form?.id || !file) throw new Error('No file or ID provided');
      const formData = new FormData();
      formData.append('file', file);
      const apiUrl = import.meta.env.VITE_API_URL;
      const endpoint = form.isOt
        ? `${apiUrl}/ots/prestations/${form.id}/reception-tech`
        : `${apiUrl}/suivi-prestations/${form.id}/reception-tech`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data: Row) => {
      setError(null);
      setForm(prev => prev ? { ...prev, fichierReceptionTech: data.fichierReceptionTech } : prev);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['suivi-prestations', user?.email] });
      if (form?.isOt) {
        queryClient.invalidateQueries({ queryKey: ['ots', user?.email] });
      }
    },
    onError: (error: any) => {
      setError(error.message || 'File upload failed');
    },
  });

  const handleSave = async () => {
    if (!form) {
      setError('Formulaire invalide');
      return;
    }
    await onSave(form);
    if (file && form.id) {
      uploadFileMutation.mutate();
    }
  };

  const realisationFields = ['dateDebut', 'dateFin', 'statutDeRealisation'];
  const receptionTechFields = ['dateRecepTech', 'fichierReceptionTech.name', 'statutReceptionTech'];
  const planificationFields = [
    'qteRealise', 'qteEncours', 'qteTech', 'qteDepose', 'qteADepose', 'qteSys',
    'fournisseur', 'datePlanifiee', 'dateGo', 'datePf', 'remarque', 'delaiRecep',
  ];

  const dateFields = ['datePlanifiee', 'dateGo', 'dateDebut', 'dateFin', 'dateRecepTech', 'datePf'];
  const statusOptions = {
    statutDeRealisation: ['Realisé', 'En cours', 'Planifié'],
    statutReceptionTech: ['Receptionné', 'En cours', 'Réserve'],
  };

  if (!open || !form) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Pencil size={20} className="text-white" />
            </div>
            Modifier {form.isOt ? 'OT Prestation' : 'Suivi Prestation'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Réalisation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns
                  .filter(col => realisationFields.includes(col.key))
                  .map(col => {
                    const value = getNested(form, col.key) ?? '';
                    const isStatusField = ['statutDeRealisation'].includes(col.key);
                    return (
                      <div key={col.key}>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">
                          {col.label}
                        </label>
                        {isStatusField ? (
                          <Select 
                            value={value || 'none'} 
                            onValueChange={val => handleChange(col.key, val)}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sélectionner...</SelectItem>
                              {statusOptions[col.key as keyof typeof statusOptions].map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="date"
                            value={value && !isNaN(new Date(value).getTime()) ? format(new Date(value), 'yyyy-MM-dd') : ''}
                            onChange={e => handleChange(col.key, e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="w-full text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Réception Technique</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns
                  .filter(col => receptionTechFields.includes(col.key))
                  .map(col => {
                    const value = getNested(form, col.key) ?? '';
                    const isStatusField = ['statutReceptionTech'].includes(col.key);
                    if (col.key === 'fichierReceptionTech.name') {
                      return (
                        <div key={col.key}>
                          <label className="block mb-2 text-sm font-semibold text-gray-700">
                            {col.label}
                          </label>
                          <div
                            className={`border-2 border-dashed rounded-lg p-4 text-center ${
                              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                          >
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.png"
                              onChange={handleFileChange}
                              className="hidden"
                              id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="h-6 w-6 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {file ? file.name : 'Glisser-déposer un fichier ou cliquer pour sélectionner'}
                                </span>
                              </div>
                            </label>
                            {form.fichierReceptionTech && (
                              <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <span>{form.fichierReceptionTech.name}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onViewFile(form)}
                                  title="Voir le fichier"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={col.key}>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">
                          {col.label}
                        </label>
                        {isStatusField ? (
                          <Select 
                            value={value || 'none'} 
                            onValueChange={val => handleChange(col.key, val)}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sélectionner...</SelectItem>
                              {statusOptions[col.key as keyof typeof statusOptions].map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="date"
                            value={value && !isNaN(new Date(value).getTime()) ? format(new Date(value), 'yyyy-MM-dd') : ''}
                            onChange={e => handleChange(col.key, e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="w-full text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Planification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns
                  .filter(col => planificationFields.includes(col.key))
                  .map(col => {
                    const value = getNested(form, col.key) ?? '';
                    return (
                      <div key={col.key}>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">
                          {col.label}
                        </label>
                        {dateFields.includes(col.key) ? (
                          <Input
                            type="date"
                            value={value && !isNaN(new Date(value).getTime()) ? format(new Date(value), 'yyyy-MM-dd') : ''}
                            onChange={e => handleChange(col.key, e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="w-full text-sm"
                          />
                        ) : (
                          <Input
                            type={['qteRealise', 'qteEncours', 'qteTech', 'qteDepose', 'qteADepose', 'qteSys'].includes(col.key) ? 'number' : 'text'}
                            value={value}
                            onChange={e => handleChange(col.key, ['qteRealise', 'qteEncours', 'qteTech', 'qteDepose', 'qteADepose', 'qteSys'].includes(col.key) ? Number(e.target.value) : e.target.value)}
                            className="w-full text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BulkEditModal: React.FC<{
  rows: Row[];
  open: boolean;
  onClose: () => void;
  onSave: (updates: { bcUpdates: Partial<Row>[]; otUpdates: any[] }, files: Map<string, File>) => void;
}> = ({ rows, open, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Row>>({});
  const [files, setFiles] = useState<Map<string, File>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editableFields = [
    'qteRealise', 'qteEncours', 'qteTech', 'qteDepose', 'qteADepose', 'qteSys',
    'fournisseur', 'datePlanifiee', 'dateGo', 'dateDebut', 'dateFin', 'dateRealisation',
    'statutDeRealisation', 'dateRecepTech', 'statutReceptionTech', 'datePf', 'remarque', 'delaiRecep',
  ];
  const dateFields = ['datePlanifiee', 'dateGo', 'dateDebut', 'dateFin', 'dateRealisation', 'dateRecepTech', 'datePf'];
  const statusOptions = {
    statutDeRealisation: ['Realisé', 'En cours', 'Planifié'],
    statutReceptionTech: ['Receptionné', 'En cours', 'Réserve'],
  };

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [key]: value === 'none' ? undefined : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, rowId: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => {
        const newFiles = new Map(prev);
        newFiles.set(rowId, e.target.files![0]);
        return newFiles;
      });
      setError(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(prev => {
        const newFiles = new Map(prev);
        newFiles.set(rowId, e.dataTransfer.files[0]);
        return newFiles;
      });
      setError(null);
    }
  };

  const handleSave = () => {
    if (!Object.keys(form).length && files.size === 0) {
      setError('Veuillez spécifier au moins une modification ou un fichier.');
      return;
    }
    const bcUpdates = rows
      .filter(row => !row.isOt)
      .map(row => ({ id: row.id, ...form }));
    const otUpdates: Record<string, any> = {};
    rows
      .filter(row => row.isOt && row.numOt)
      .forEach(row => {
        if (!otUpdates[row.numOt!]) {
          otUpdates[row.numOt!] = {
            numOt: row.numOt,
            prestations: [],
          };
        }
        otUpdates[row.numOt!].prestations.push({
          id: parseInt(row.id),
          ...form,
        });
      });
    onSave({ bcUpdates, otUpdates: Object.values(otUpdates) }, files);
    setForm({});
    setFiles(new Map());
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Pencil size={20} className="text-white" />
            </div>
            Modifier en masse ({rows.length} prestations)
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mise à jour des champs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {columns
                  .filter(col => editableFields.includes(col.key))
                  .map(col => {
                    const value = form[col.key as keyof Row] ?? '';
                    const isStatusField = ['statutDeRealisation', 'statutReceptionTech'].includes(col.key);
                    return (
                      <div key={col.key}>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">
                          {col.label} (laisser vide pour ne pas modifier)
                        </label>
                        {isStatusField ? (
                          <Select
                            value={typeof value === 'string' ? value : 'none'}
                            onValueChange={val => handleChange(col.key, val)}
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue placeholder="Ne pas modifier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ne pas modifier</SelectItem>
                              {statusOptions[col.key as keyof typeof statusOptions].map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : dateFields.includes(col.key) ? (
                          <Input
                            type="date"
                            value={
                              typeof value === 'string' && !isNaN(new Date(value).getTime())
                                ? format(new Date(value), 'yyyy-MM-dd')
                                : ''
                            }
                            onChange={e =>
                              handleChange(
                                col.key,
                                e.target.value ? new Date(e.target.value).toISOString() : undefined
                              )
                            }
                            className="w-full text-sm"
                            placeholder="Ne pas modifier"
                          />
                        ) : (
                          <Input
                            type={['qteRealise', 'qteEncours', 'qteTech', 'qteDepose', 'qteADepose', 'qteSys'].includes(col.key) ? 'number' : 'text'}
                            value={typeof value === 'string' || typeof value === 'number' ? value : ''}
                            onChange={e => handleChange(col.key, ['qteRealise', 'qteEncours', 'qteTech', 'qteDepose', 'qteADepose', 'qteSys'].includes(col.key) ? Number(e.target.value) : e.target.value)}
                            className="w-full text-sm"
                            placeholder="Ne pas modifier"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Téléchargement de fichiers</h3>
              {rows.map(row => (
                <div key={row.id} className="mb-4">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Fichier pour {row.bc_num} {row.isOt ? `(OT ${row.numOt})` : ''} (ID: {row.id})
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center ${
                      dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={e => handleDrop(e, row.id)}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={e => handleFileChange(e, row.id)}
                      className="hidden"
                      id={`file-upload-${row.id}`}
                    />
                    <label htmlFor={`file-upload-${row.id}`} className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {files.get(row.id)?.name || 'Glisser-déposer un fichier ou cliquer pour sélectionner'}
                        </span>
                      </div>
                    </label>
                    {row.fichierReceptionTech && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span>{row.fichierReceptionTech.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SuiviListCoordinator: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: suiviData = [], isLoading: isSuiviLoading } = useQuery<Row[], Error>({
    queryKey: ['suivi-prestations', user?.email],
    queryFn: () => getSuiviPrestationsByEmail(user?.email || ''),
    enabled: !!user?.email,
  });

  const { data: otData = [], isLoading: isOtLoading } = useQuery<Ot[], Error>({
    queryKey: ['ots', user?.email],
    queryFn: () => getOtsByEmail(user?.email || ''),
    enabled: !!user?.email,
  });

  const combinedData = useMemo(() => {
    const otRows: Row[] = otData.flatMap(ot =>
      ot.prestations.map(prestation => ({
        id: prestation.id.toString(),
        numLigne: prestation.numLigne?.toString() || '',
        coordinateur: ot.coordinateur || '',
        dateRecepSys: prestation.dateRecepSys || '',
        bc_num: 'en cours',
        zone: ot.zone ? { id: ot.zone.id, nom: ot.zone.nom } : { id: 'N/A', nom: 'N/A' },
        site: ot.codeSite?.codesite || 'N/A',
        fournisseur: prestation.fournisseur || '',
        prestation: {
          famille: prestation.famille || 'N/A',
          description: ot.prestations.at(0)?.service?.description || 'OT Description',
          service: {
            id: prestation.service?.id,
            prix: prestation.service?.prix || 0,
            nomService: prestation.service?.nomService || 'N/A',
            famille: prestation.service?.famille ? { name: prestation.service.famille.name } : undefined,
          }
        },
        datePlanifiee: prestation.datePlanifiee,
        dateGo: ot.dateGo ? format(new Date(ot.dateGo), 'yyyy-MM-dd') : undefined,
        dateRealisation: prestation.dateRealisation,
        qteRealise: prestation.qteRealise || 0,
        qteEncours: prestation.qteEncours || 0,
        qteTech: prestation.qteTech || 0,
        qteDepose: prestation.qteDepose || 0,
        qteADepose: prestation.qteADepose || 0,
        qteSys: prestation.qteSys || 0,
        dateEdition: undefined,
        dateDebut: prestation.dateDebut,
        dateFin: prestation.dateFin,
        statutDeRealisation: prestation.statutDeRealisation || 'Planifié',
        dateRecepTech: prestation.dateRecepTech,
        statutReceptionTech: prestation.statutDeRecepTech || 'En cours',
        datePf: prestation.datePf ?? '',
        statutReceptionSystem: prestation.statutReceptionSystem || 'En cours',
        remarque: prestation.remarque || '',
        delaiRecep: prestation.delaiRecep?.toString() || '',
        fichierReceptionTech: prestation.fichierReceptionTech,
        isOt: true,
        numOt: ot.numOt,
      }))
    );
    return [...suiviData, ...otRows];
  }, [suiviData, otData]);

  const updateMutation = useMutation({
    mutationFn: async (updatedRow: Row) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (updatedRow.isOt && updatedRow.numOt) {
        const otUpdate = {
          numOt: updatedRow.numOt,
          divisionProjet: updatedRow.prestation.description,
          codeProjet: undefined,
          zoneId: parseInt(updatedRow.zone?.id) || undefined,
          dateGo: updatedRow.dateGo ? format(new Date(updatedRow.dateGo), 'yyyy-MM-dd') : undefined,
          codeSite: updatedRow.site || undefined,
          backOfficeId: undefined,
          prestations: [
            {
              id: parseInt(updatedRow.id),
              numLigne: updatedRow.numLigne ? parseInt(updatedRow.numLigne) : undefined,
              quantiteValide: updatedRow.qteRealise,
              qteRealise: updatedRow.qteRealise,
              serviceId: updatedRow.prestation.service?.id,
              famille: updatedRow.prestation.famille,
              remarque: updatedRow.remarque,
              coordinateurId: updatedRow.coordinateur?.id,
              fournisseur: updatedRow.fournisseur,
              datePlanifiee: updatedRow.datePlanifiee,
              dateDebut: updatedRow.dateDebut,
              dateFin: updatedRow.dateFin,
              dateRealisation: updatedRow.dateRealisation,
              statutDeRealisation: updatedRow.statutDeRealisation,
              dateRecepTech: updatedRow.dateRecepTech,
              statutDeRecepTech: updatedRow.statutReceptionTech,
              datePf: updatedRow.datePf,
              dateRecepSys: updatedRow.dateRecepSys,
              statutReceptionSystem: updatedRow.statutReceptionSystem,
              delaiRecep: updatedRow.delaiRecep ? parseInt(updatedRow.delaiRecep) : undefined,
            },
          ],
        };
        await axios.put(`${apiUrl}/ots/${updatedRow.numOt}`, otUpdate, {
          headers: getAuthHeaders(),
        });
      } else {
        await axios.put(`${apiUrl}/suivi-prestations/${updatedRow.id}`, updatedRow, {
          headers: getAuthHeaders(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suivi-prestations', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['ots', user?.email] });
      setEditRow(null);
      setError(null);
    },
    onError: (error: any) => {
      console.error('Update error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to update');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ bcUpdates, otUpdates, files }: { bcUpdates: Partial<Row>[]; otUpdates: any[]; files: Map<string, File> }) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (bcUpdates.length > 0) {
        await axios.put(`${apiUrl}/suivi-prestations/bulk`, bcUpdates, {
          headers: getAuthHeaders(),
        });
      }
      if (otUpdates.length > 0) {
        const formattedOtUpdates = otUpdates.map(ot => ({
          ...ot,
          zoneId: ot.zoneId ? parseInt(ot.zoneId) : undefined,
          dateGo: ot.dateGo ? format(new Date(ot.dateGo), 'yyyy-MM-dd') : undefined,
          codeSite: ot.codeSite || undefined,
          prestations: ot.prestations.map((prestation: any) => ({
            ...prestation,
            id: parseInt(prestation.id),
            numLigne: prestation.numLigne ? parseInt(prestation.numLigne) : undefined,
            quantiteValide: prestation.qteRealise,
            qteRealise: prestation.qteRealise,
            serviceId: prestation.prestation?.service?.id,
            delaiRecep: prestation.delaiRecep ? parseInt(prestation.delaiRecep) : undefined,
          })),
        }));
        await axios.put(`${apiUrl}/ots/bulk`, formattedOtUpdates, {
          headers: getAuthHeaders(),
        });
      }
      for (const [id, file] of files) {
        const row = combinedData.find(row => row.id === id);
        if (!row) continue;
        const formData = new FormData();
        formData.append('file', file);
        const endpoint = row.isOt
          ? `${apiUrl}/ots/prestations/${id}/reception-tech`
          : `${apiUrl}/suivi-prestations/${id}/reception-tech`;
        await axios.post(endpoint, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suivi-prestations', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['ots', user?.email] });
      setSelectedRows([]);
      setError(null);
    },
    onError: (error: any) => {
      console.error('Bulk update error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to bulk update');
    },
  });

  const markAsRealiseMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const bcIds = ids.filter(id => !combinedData.find(row => row.id === id)?.isOt);
      const otRows = ids
        .map(id => combinedData.find(row => row.id === id))
        .filter((row): row is Row => !!row && row.isOt === true && !!row.numOt);
      const otUpdates: Record<string, any> = {};
      otRows.forEach(row => {
        if (!otUpdates[row.numOt!]) {
          otUpdates[row.numOt!] = {
            numOt: row.numOt,
            zoneId: parseInt(row.zone?.id) || undefined,
            codeSite: row.site || undefined,
            dateGo: row.dateGo ? format(new Date(row.dateGo), 'yyyy-MM-dd') : undefined,
            prestations: [],
          };
        }
        otUpdates[row.numOt!].prestations.push({
          id: parseInt(row.id),
          statutDeRealisation: 'Realisé',
          dateRealisation: new Date().toISOString(),
          qteRealise: row.qteRealise,
        });
      });
      if (bcIds.length > 0) {
        const bcUpdates = bcIds.map(id => ({
          id,
          statutDeRealisation: 'Realisé',
          dateRealisation: new Date().toISOString(),
        }));
        await axios.put(`${apiUrl}/suivi-prestations/bulk`, bcUpdates, {
          headers: getAuthHeaders(),
        });
      }
      if (Object.keys(otUpdates).length > 0) {
        const formattedOtUpdates = Object.values(otUpdates).map(ot => ({
          ...ot,
          zoneId: ot.zoneId ? parseInt(ot.zoneId) : undefined,
          dateGo: ot.dateGo ? format(new Date(ot.dateGo), 'yyyy-MM-dd') : undefined,
        }));
        await axios.put(`${apiUrl}/ots/bulk`, formattedOtUpdates, {
          headers: getAuthHeaders(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suivi-prestations', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['ots', user?.email] });
      setSelectedRows([]);
      setError(null);
    },
    onError: (error: any) => {
      console.error('Mark as réalisé error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to mark as Realisé');
    },
  });

  const filteredData = useMemo(() => {
    let result = [...combinedData];

    Object.entries(filters).forEach(([column, values]) => {
      if (values.length > 0) {
        result = result.filter(row => {
          const value = getNested(row, column);
          return value !== null && value !== undefined && values.includes(String(value));
        });
      }
    });

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const value = getNested(row, col.key);
          return value && String(value).toLowerCase().includes(lowerSearch);
        })
      );
    }

    const predefinedFilter = filters['predefined']?.[0];
    if (predefinedFilter) {
      if (predefinedFilter === 'pending') {
        result = result.filter(row => row.statutDeRealisation === 'PENDING' || row.statutDeRealisation === 'Planifié');
      } else if (predefinedFilter === 'overdue') {
        result = result.filter(row => {
          if (!row.datePlanifiee) return false;
          return isBefore(new Date(row.datePlanifiee), new Date()) && row.statutDeRealisation !== 'Realisé';
        });
      } else if (predefinedFilter === 'completed') {
        result = result.filter(row => row.statutDeRealisation === 'Realisé');
      }
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = getNested(a, sortConfig.key) ?? '';
        const bValue = getNested(b, sortConfig.key) ?? '';
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [combinedData, filters, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handleFilterChange = (column: string, values: string[]) => {
    setFilters(prev => ({ ...prev, [column]: values }));
    setCurrentPage(1);
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(row => row.id));
    }
  };

  const handleViewFile = async (row: Row) => {
    if (!row.fichierReceptionTech) return;
    const apiUrl = import.meta.env.VITE_API_URL;
    const endpoint = row.isOt
      ? `${apiUrl}/ots/prestations/${row.id}/reception-tech`
      : `${apiUrl}/suivi-prestations/${row.id}/reception-tech`;
    try {
      const response = await fetch(endpoint, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = row.fichierReceptionTech.name;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error fetching file:', error);
      setError('Erreur lors de la récupération du fichier');
    }
  };

  const handleSave = (updatedRow: Row) => {
    updateMutation.mutate(updatedRow);
  };

  const handleBulkSave = (updates: { bcUpdates: Partial<Row>[]; otUpdates: any[] }, files: Map<string, File>) => {
    bulkUpdateMutation.mutate({ bcUpdates: updates.bcUpdates, otUpdates: updates.otUpdates, files });
  };

  const handleMarkAsRealise = () => {
    if (selectedRows.length === 0) {
      setError('Veuillez sélectionner au moins une prestation.');
      return;
    }
    markAsRealiseMutation.mutate(selectedRows);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Realisé':
      case 'Receptionné':
        return 'bg-green-100 text-green-700';
      case 'En cours':
        return 'bg-yellow-100 text-yellow-700';
      case 'Planifié':
        return 'bg-blue-100 text-blue-700';
      case 'Réserve':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isOverdue = (datePlanifiee?: string) => {
    if (!datePlanifiee) return false;
    return isBefore(new Date(datePlanifiee), new Date()) && datePlanifiee !== 'Realisé';
  };

  const activeFiltersCount = Object.values(filters).reduce((acc, f) => acc + f.length, 0);

  const renderPagination = () => {
    const maxPagesToShow = 5;
    const pages: (number | string)[] = [];
    const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Précédent
        </Button>
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2">...</span>
            ) : (
              <Button
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(Number(page))}
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Suivant
        </Button>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Suivi des Prestations</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={pageSize.toString()}
            onValueChange={value => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 par page</SelectItem>
              <SelectItem value="10">10 par page</SelectItem>
              <SelectItem value="20">20 par page</SelectItem>
              <SelectItem value="50">50 par page</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setBulkEditOpen(true)}
            disabled={selectedRows.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Modifier en masse ({selectedRows.length})
          </Button>
          <Button
            onClick={handleMarkAsRealise}
            disabled={selectedRows.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Marquer comme Réalisé
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <Select
          value={filters['predefined']?.[0] || 'all'}
          onValueChange={value => handleFilterChange('predefined', value === 'all' ? [] : [value])}
        >
          <SelectTrigger className="w-[200px] text-sm">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="overdue">En retard</SelectItem>
            <SelectItem value="completed">Complété</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key} className="text-sm">
                  <div className="flex items-center gap-1">
                    {col.key === 'select' ? (
                      <Checkbox
                        checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    ) : (
                      <>
                        <span
                          className="cursor-pointer hover:text-blue-600"
                          onClick={() => col.key !== 'actions' && handleSort(col.key)}
                        >
                          {col.label}
                        </span>
                        {col.key !== 'actions' && (
                          <>
                            {sortConfig?.key === col.key && (
                              sortConfig.direction === 'asc' ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            )}
                            <ExcelFilter
                              column={col.key}
                              title={col.label}
                              data={combinedData}
                              filters={filters}
                              onFilterChange={handleFilterChange}
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSuiviLoading || isOtLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Aucune donnée disponible
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(row => (
                <TableRow key={row.id} className={isOverdue(row.datePlanifiee) ? 'bg-red-50' : ''}>
                  {columns.map(col => {
                    if (col.key === 'select') {
                      return (
                        <TableCell key={col.key}>
                          <Checkbox
                            checked={selectedRows.includes(row.id)}
                            onCheckedChange={() => handleSelectRow(row.id)}
                          />
                        </TableCell>
                      );
                    }
                    if (col.key === 'actions') {
                      return (
                        <TableCell key={col.key} className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditRow(row)}
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {row.fichierReceptionTech && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewFile(row)}
                              title="Voir le fichier"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      );
                    }
                    const value = getNested(row, col.key);
                    let displayValue: any = value ?? '';
                    if (col.type === 'date' && value) {
                      displayValue = !isNaN(new Date(value).getTime())
                        ? format(new Date(value), 'dd/MM/yyyy')
                        : '';
                    } else if (col.type === 'currency') {
                      displayValue = value ? `${Number(value).toFixed(2)} €` : '0.00 €';
                    } else if (col.type === 'qty') {
                      displayValue = value || 0;
                    } else if (col.key === 'montantTotal') {
                      const qty = row.qteRealise || 0;
                      const price = row.prestation.service?.prix || 0;
                      displayValue = (qty * price).toFixed(2) + ' €';
                    } else if (['statutDeRealisation', 'statutReceptionTech'].includes(col.key)) {
                      displayValue = (
                        <span className={`px-2 py-1 rounded ${getStatusColor(value)}`}>
                          {value || 'N/A'}
                        </span>
                      );
                    }
                    return (
                      <TableCell key={col.key} className="text-sm">
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {filteredData.length} éléments | Page {currentPage} sur {totalPages} | {activeFiltersCount} filtre(s) actif(s)
        </span>
        {renderPagination()}
      </div>
      <EditSuiviModal
        row={editRow}
        open={!!editRow}
        onClose={() => setEditRow(null)}
        onSave={handleSave}
        onViewFile={handleViewFile}
      />
      <BulkEditModal
        rows={combinedData.filter(row => selectedRows.includes(row.id))}
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onSave={handleBulkSave}
      />
    </div>
  );
};

export default SuiviListCoordinator;