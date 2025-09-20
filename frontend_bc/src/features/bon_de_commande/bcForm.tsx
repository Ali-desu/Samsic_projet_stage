import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBC, getServices } from './bcApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useNavigate, useParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, FileText } from 'lucide-react';
import axios from 'axios';

interface Prestation {
  id?: string;
  numLigne: number;
  qteBc: number;
  serviceId: string | number;
  famille: string;
}


export interface BonDeCommande {
  numBc: string;
  divisionProjet: string;
  codeProjet: string;
  dateEdition: string;
  numProjetFacturation: string;
  numPvReception: string;
  description: string;
  backOfficeId:  number;
  prestations: Prestation[];
  isOt?: boolean;
  bc_file?: string; // Backend returns this as a string (base64 or file path)
  [key: string]: any; // Index signature for dynamic access
}

const initialState: BonDeCommande = {
  numBc: '',
  divisionProjet: '',
  codeProjet: '',
  dateEdition: '',
  numProjetFacturation: '',
  numPvReception: '',
  backOfficeId: Number(localStorage.getItem('backOfficeId')),
  prestations: [],
  description: ''
};

export default function BCForm({ onSuccess, initialData, isEditMode }: { onSuccess?: () => void, initialData?: Partial<BonDeCommande>, isEditMode?: boolean }) {
  const navigate = useNavigate();
  const { num_bc } = useParams<{ num_bc?: string }>();
  const isEdit = isEditMode || Boolean(num_bc);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<BonDeCommande>(initialData ? { ...initialState, ...initialData } : initialState);
  const [prestations, setPrestations] = useState<Prestation[]>(initialData && initialData.prestations ? initialData.prestations : []);
  const [bcFile, setBcFile] = useState<File | undefined>(undefined);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFamilles, setSelectedFamilles] = useState<Record<number, string>>({});

  // Fetch BC for edit
  const { data: bcData } = useQuery({
    queryKey: ['bc', num_bc],
    queryFn: () => (num_bc ? getBC(num_bc) : Promise.resolve(undefined)),
    enabled: isEdit && !initialData,
  });

  // Fetch services (all)
  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
  });

  // Fetch familles
  const { data: familles = [], isLoading: loadingFamilles } = useQuery({
    queryKey: ['familles'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/familles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return res.data;
    },
  });

  // Map famille options
  const familleOptions = familles.map((famille: any) => ({
    id: famille.id,
    name: famille.name,
  }));

  useEffect(() => {
    if (bcData && !initialData) {
      setForm(bcData);
      setPrestations(bcData.prestations);
      setSelectedFamilles(
        (bcData.prestations || []).reduce((acc: Record<number, string>, p: any, idx: number) => {
          if (p.famille) acc[idx] = p.famille;
          return acc;
        }, {})
      );
    }
  }, [bcData, initialData]);

  const mutation = useMutation({
    mutationFn: async (data: { form: BonDeCommande, prestations: Prestation[], file?: File }) => {
      const formData = new FormData();
      if (data.file) {
        formData.append('bc_file', data.file);
      }
      const requestBody = {
        numBc: data.form.numBc,
        divisionProjet: data.form.divisionProjet,
        codeProjet: data.form.codeProjet,
        dateEdition: data.form.dateEdition,
        numProjetFacturation: data.form.numProjetFacturation,
        numPvReception: data.form.numPvReception,
        backOfficeId: data.form.backOfficeId,
        prestations: data.prestations,
      };
      formData.append('request', new Blob([JSON.stringify(requestBody)], { type: 'application/json' }));
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/bon-de-commande${isEdit ? `/${data.form.numBc}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save Bon de Commande');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bcs'] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/app/back_office/bc');
      }
    },
    onError: (error: any) => console.error('Mutation error:', error.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddPrestation = () => {
    setPrestations([
      ...prestations,
      {
        id: '',
        numLigne: prestations.length + 1,
        qteBc: 1,
        serviceId: '',
        famille: '',
      },
    ]);
  };

  const handleRemovePrestation = (idx: number) => {
    setPrestations(prestations.filter((_, i) => i !== idx));
    setSelectedFamilles(prev => {
      const newFamilles = { ...prev };
      delete newFamilles[idx];
      return newFamilles;
    });
  };

  const handlePrestationChange = (idx: number, field: string, value: any) => {
    setPrestations(prev => {
      const newPrestations = [...prev];
      newPrestations[idx] = { ...newPrestations[idx], [field]: value };
      return newPrestations;
    });

    if (field === 'famille') {
      setSelectedFamilles(prev => ({
        ...prev,
        [idx]: value ? familleOptions.find((opt: any) => String(opt.id) === String(value))?.name || '' : '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ 
      form: { ...form, backOfficeId: 1 }, 
      prestations,
      file: bcFile 
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setBcFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setBcFile(files[0]);
    }
  };

  const removeFile = () => {
    setBcFile(undefined);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const divisionOptions = ['ODT SITES', 'ODT POP', 'ODT DC'];

  // Filter services by selected famille for each prestation
  const getFilteredServices = (idx: number) => {
    const familleName = selectedFamilles[idx];
    if (!familleName) return services;
    return services.filter((s: any) => s.famille?.name === familleName);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-32px)] w-full overflow-y-auto">
      <Card className="w-full max-w-2xl rounded-2xl shadow-lg border border-accent/40 p-8">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-primary mb-6">{isEdit ? 'Éditer' : 'Ajouter'} un Bon de Commande</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Numéro BC</label>
                <Input
                  name="numBc"
                  value={form.numBc}
                  onChange={handleChange}
                  required
                  disabled={isEdit}
                  placeholder="Numéro BC"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Division Projet</label>
                <Select value={form.divisionProjet} onValueChange={val => setForm({ ...form, divisionProjet: val })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir une division" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisionOptions.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Code Projet</label>
                <Input name="codeProjet" value={form.codeProjet} onChange={handleChange} required placeholder="Code Projet" />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Date Édition</label>
                <Input name="dateEdition" type="date" value={form.dateEdition} onChange={handleChange} required />
              </div>
              {isEdit && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-muted-foreground">Num Projet Facturation</label>
                    <Input
                      name="numProjetFacturation"
                      value={form.numProjetFacturation}
                      onChange={handleChange}
                      placeholder="Num Projet Facturation"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-muted-foreground">Num PV Réception</label>
                    <Input
                      name="numPvReception"
                      value={form.numPvReception}
                      onChange={handleChange}
                      placeholder="Num PV Réception"
                    />
                  </div>
                </>
              )}
            </div>

            {/* File Upload Section */}
            <div className="mt-6">
              <label className="block mb-2 text-sm font-semibold text-muted-foreground">Fichier BC</label>
              {!bcFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Glissez-déposez votre fichier BC ici ou</p>
                  <label className="cursor-pointer">
                    <span className="text-primary hover:text-primary/80 font-medium">cliquez pour sélectionner</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">Formats acceptés: PDF, DOC, DOCX, XLS, XLSX</p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{bcFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(bcFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFile} className="text-destructive hover:text-destructive/80">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Prestations Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">Prestations</h3>
                <Button type="button" variant="outline" onClick={handleAddPrestation}>Ajouter Prestation</Button>
              </div>
              <div className="space-y-4">
                {prestations.map((p, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-muted/30 relative">
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-destructive hover:text-destructive/80"
                      onClick={() => handleRemovePrestation(idx)}
                    >
                      ✕
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm font-semibold text-muted-foreground">Numéro Ligne</label>
                        <Input
                          type="number"
                          value={p.numLigne}
                          onChange={e => handlePrestationChange(idx, 'numLigne', Number(e.target.value))}
                          required
                          min={1}
                          placeholder="Numéro Ligne"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-semibold text-muted-foreground">Quantité BC</label>
                        <Input
                          type="number"
                          value={p.qteBc}
                          onChange={e => handlePrestationChange(idx, 'qteBc', Number(e.target.value))}
                          required
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-semibold text-muted-foreground">Famille Projet</label>
                        <Select
                          value={p.famille ? String(p.famille) : ''}
                          onValueChange={val => handlePrestationChange(idx, 'famille', val)}
                          disabled={loadingFamilles}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisir une famille" />
                          </SelectTrigger>
                          <SelectContent>
                            {familleOptions.map((opt: any) => (
                              <SelectItem key={opt.id} value={String(opt.id)}>{opt.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-semibold text-muted-foreground">Service</label>
                        <Select
                          value={p.serviceId ? String(p.serviceId) : ''}
                          onValueChange={val => handlePrestationChange(idx, 'serviceId', Number(val))}
                          disabled={loadingServices || !selectedFamilles[idx]}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={selectedFamilles[idx] ? "Choisir un service" : "Sélectionner une famille d'abord"} />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredServices(idx).map((s: any) => (
                              <SelectItem key={s.id} value={String(s.id)}>{s.description}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <Button type="submit" className="font-bold">{isEdit ? 'Mettre à jour' : 'Créer le BC'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}