import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getZones } from '../../features/bon_de_commande/bcApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import ReactSelect from 'react-select';

interface Prestation {
  id?: string;
  numLigne: number;
  quantiteValide: number;
  serviceId: string | number;
  famille: string;
  remarque?: string;
  prestationId?: string | null;
  fournisseur?: string;
}

interface Ot {
  numOt: string;
  divisionProjet: string;
  codeProjet: string;
  zoneId: string | number;
  dateGo: string;
  codeSite: string;
  backOfficeId: number;
  numBc?: string;
  prestations: Prestation[];
}

interface Bc {
  numBc: string;
  prestations: PrestationSummary[];
}

interface PrestationSummary {
  id: string;
  numLigne: number;
  famille: string;
  description: string;
  service: { id: number } | null;
  fournisseur?: string;
}

interface Service {
  id: number;
  description: string;
  famille: { id: string; name: string };
}

interface Famille {
  id: string;
  name: string;
}

interface Zone {
  id: number;
  nom: string;
}

interface Site {
  id: number;
  codesite: string;
  zone: Zone;
  region: string;
}

const initialState: Ot = {
  numOt: '',
  divisionProjet: '',
  codeProjet: '',
  zoneId: '',
  dateGo: '',
  codeSite: '',
  backOfficeId: 1,
  prestations: [],
};

export default function OTForm({ onSuccess, initialData, isEditMode }: { onSuccess?: () => void; initialData?: Partial<Ot>; isEditMode?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Ot>(initialData ? { ...initialState, ...initialData } : initialState);
  const [prestations, setPrestations] = useState<Prestation[]>(initialData && initialData.prestations ? initialData.prestations : []);
  const [selectedFamilles, setSelectedFamilles] = useState<Record<number, string>>({});
  const [selectedBc, setSelectedBc] = useState<string | null>(null);

  // Fetch BCs
  const { data: bcs = [], isLoading: loadingBcs } = useQuery<Bc[], Error>({
    queryKey: ['bcs'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/bon-de-commande`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('BCs response:', JSON.stringify(res.data, null, 2));
      return Array.isArray(res.data) ? res.data : []; // Normalize to array
    },
  });

  // Fetch all services for OT mode
  const { data: allServices = [], isLoading: loadingAllServices } = useQuery<Service[], Error>({
    queryKey: ['services'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/services`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('All services response:', JSON.stringify(res.data, null, 2));
      return res.data;
    },
    enabled: !selectedBc,
  });

  // Fetch services for SuiviPrestation mode
  const {  isLoading: loadingBcServices } = useQuery<Service[], Error>({
    queryKey: ['bcServices', selectedBc],
    queryFn: async () => {
      if (!selectedBc) return [];
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/bon-de-commande/${selectedBc}/services`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('BC services response:', JSON.stringify(res.data, null, 2));
      return res.data;
    },
    enabled: !!selectedBc,
  });

  // Fetch zones
  const { data: zones = [], isLoading: loadingZones } = useQuery<Zone[], Error>({
    queryKey: ['zones'],
    queryFn: getZones,
  });

  // Fetch sites
  const { data: sites = [], isLoading: loadingSites } = useQuery<Site[], Error>({
    queryKey: ['sites'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/site`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Sites response:', JSON.stringify(res.data, null, 2));
      return res.data;
    },
  });

  // Fetch familles
  const { data: familles = [], isLoading: loadingFamilles } = useQuery<Famille[], Error>({
    queryKey: ['familles'],
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await axios.get(`${apiUrl}/familles`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Familles response:', JSON.stringify(res.data, null, 2));
      return res.data;
    },
  });

  // Filter services by famille for OT mode
  const getFilteredServices = (familleName: string): Service[] => {
    if (!familleName || selectedBc) return [];
    return allServices.filter(s => s.famille?.name === familleName);
  };

  // Filter sites by selected zone
  const filteredSites = useMemo(() => {
    if (!form.zoneId) return sites;
    return sites.filter(site => site.zone.id === Number(form.zoneId));
  }, [sites, form.zoneId]);

  // Memoize bcPrestations
  const bcPrestations = useMemo(() => {
    if (!selectedBc || !bcs) {
      console.log('bcPrestations: empty due to', { selectedBc, bcsAvailable: !!bcs });
      return [];
    }
    const bc = bcs.find(b => b.numBc === selectedBc);
    const prestations = bc && bc.prestations ? bc.prestations : [];
    console.log('bcPrestations:', JSON.stringify(prestations, null, 2));
    return prestations;
  }, [selectedBc, bcs]);

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialState, ...initialData });
      setPrestations(initialData.prestations || []);
      setSelectedBc(initialData.numBc || null);
      setSelectedFamilles(
        (initialData.prestations || []).reduce((acc: Record<number, string>, p: any, idx: number) => {
          if (p.famille) acc[idx] = p.famille;
          return acc;
        }, {})
      );
    }
  }, [initialData]);

  // Update zoneId when codeSite changes
  useEffect(() => {
    if (form.codeSite) {
      const selectedSite = sites.find(site => site.codesite === form.codeSite);
      if (selectedSite && selectedSite.zone.id !== Number(form.zoneId)) {
        setForm(prev => ({ ...prev, zoneId: String(selectedSite.zone.id) }));
      }
    }
  }, [form.codeSite, sites, form.zoneId]);

  const mutation = useMutation<void, Error, { form: Ot; prestations: Prestation[] }>({
    mutationFn: async (data) => {
      if (data.form.numBc) {
        console.log('SuiviPrestation request body:', JSON.stringify({
          numBc: data.form.numBc,
          prestations: data.prestations,
        }, null, 2));
        const requestBody = {
          numBc: data.form.numBc,
          prestations: data.prestations.map(p => ({
            prestationId: p.prestationId,
            serviceId: Number(p.serviceId) || null,
            quantiteValide: p.quantiteValide,
            remarque: p.remarque,
            zoneId: Number(data.form.zoneId),
            fournisseur: p.fournisseur,
          })),
        };
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/suivi-prestations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to save SuiviPrestation');
        }
      } else {
        const requestBody = {
          numOt: data.form.numOt,
          divisionProjet: data.form.divisionProjet,
          codeProjet: data.form.codeProjet,
          zoneId: Number(data.form.zoneId),
          dateGo: data.form.dateGo,
          codeSite: data.form.codeSite,
          backOfficeId: data.form.backOfficeId,
          prestations: data.prestations.map(p => ({
            numLigne: p.numLigne,
            quantiteValide: p.quantiteValide,
            serviceId: Number(p.serviceId),
            famille: p.famille,
            remarque: p.remarque,
          })),
        };
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(`${apiUrl}/ots${isEditMode && data.form.numOt ? `/${data.form.numOt}` : ''}`, {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Failed to save Ordre de Travail');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [selectedBc ? 'suiviPrestations' : 'ots'] });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(selectedBc ? '/app/back_office/suivi' : '/app/back_office/ot');
      }
    },
    onError: (error) => console.error('Mutation error:', error.message),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleBcChange = (selectedOption: { value: string; label: string } | null) => {
    setSelectedBc(selectedOption ? selectedOption.value : null);
    setForm({ ...form, numBc: selectedOption ? selectedOption.value : undefined });
    setPrestations([]);
    setSelectedFamilles({});
  };

  const handleAddPrestation = () => {
    setPrestations([
      ...prestations,
      {
        numLigne: prestations.length + 1,
        quantiteValide: 1,
        serviceId: '',
        famille: '',
        remarque: '',
        ...(selectedBc ? { prestationId: null, fournisseur: '' } : {}),
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
      const familleName = value ? familles.find((opt: Famille) => String(opt.id) === String(value))?.name || '' : '';
      setSelectedFamilles(prev => ({
        ...prev,
        [idx]: familleName,
      }));
      if (!selectedBc) {
        setPrestations(prev => {
          const newPrestations = [...prev];
          newPrestations[idx] = { ...newPrestations[idx], serviceId: '' };
          return newPrestations;
        });
      }
    }

    if (field === 'prestationId') {
      const selectedPrestation = bcPrestations.find((prest: PrestationSummary) => prest.id === value);
      console.log('Selected prestation:', JSON.stringify(selectedPrestation, null, 2));
      if (selectedPrestation) {
        setPrestations(prev => {
          const newPrestations = [...prev];
          newPrestations[idx] = {
            ...newPrestations[idx],
            serviceId: selectedPrestation.service?.id || '',
            famille: selectedPrestation.famille || '',
            fournisseur: selectedPrestation.fournisseur || '',
          };
          return newPrestations;
        });
        setSelectedFamilles(prev => ({
          ...prev,
          [idx]: selectedPrestation.famille || '',
        }));
        if (!selectedPrestation.service?.id) {
          console.warn(`No valid service.id for prestation ${value}`);
          alert(`Prestation ${selectedPrestation.description} has no associated service.`);
        }
      } else {
        setPrestations(prev => {
          const newPrestations = [...prev];
          newPrestations[idx] = {
            ...newPrestations[idx],
            serviceId: '',
            famille: '',
            fournisseur: '',
          };
          return newPrestations;
        });
        setSelectedFamilles(prev => ({
          ...prev,
          [idx]: '',
        }));
      }
    }
  };

  const isSubmitDisabled = selectedBc
    ? prestations.length === 0 ||
      prestations.some(p => !p.prestationId || p.prestationId === '' || !p.serviceId || p.serviceId === '') ||
      !form.zoneId ||
      !form.codeSite
    : !form.numOt ||
      prestations.length === 0 ||
      prestations.some(p => !p.serviceId || !p.famille) ||
      !form.zoneId ||
      !form.codeSite;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form state before submission:', JSON.stringify({ form, prestations }, null, 2));
    if (selectedBc) {
      const invalidPrestations = prestations
        .map((p, idx) => {
          if (!p.prestationId || p.prestationId === '') return `Line ${idx + 1}: Missing prestation`;
          if (!p.serviceId || p.serviceId === '') return `Line ${idx + 1}: Missing or invalid service`;
          return null;
        })
        .filter(msg => msg !== null);
      if (invalidPrestations.length > 0) {
        alert(invalidPrestations.join('\n'));
        return;
      }
      if (!form.zoneId) {
        alert('Please select a zone for SuiviPrestation');
        return;
      }
      if (!form.codeSite) {
        alert('Please select a site for SuiviPrestation');
        return;
      }
    } else {
      if (!form.numOt) {
        alert('Please provide a Numéro OT for Ordre de Travail');
        return;
      }
      if (prestations.some(p => !p.serviceId || !p.famille)) {
        alert('Please select a valid famille and service for all prestations');
        return;
      }
      if (!form.zoneId) {
        alert('Please select a zone for Ordre de Travail');
        return;
      }
      if (!form.codeSite) {
        alert('Please select a site for Ordre de Travail');
        return;
      }
    }
    mutation.mutate({ form, prestations });
  };

  const divisionOptions = ['ODT SITES', 'ODT POP', 'ODT DC'];
  const bcOptions = bcs.map((bc: Bc) => ({ value: bc.numBc, label: bc.numBc }));
  const familleOptions = familles.map((famille: Famille) => ({
    id: famille.id,
    name: famille.name,
  }));

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-32px)] w-full overflow-y-auto">
      <Card className="w-full max-w-2xl rounded-2xl shadow-lg border border-accent/40 p-8">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-primary mb-6">
            {isEditMode ? 'Éditer' : 'Ajouter'} un Ordre de Travail ou Suivi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Bon de Commande (Optionnel)</label>
                <ReactSelect
                  options={bcOptions}
                  value={bcOptions.find(opt => opt.value === selectedBc) || null}
                  onChange={handleBcChange}
                  isClearable
                  isLoading={loadingBcs}
                  placeholder="Sélectionner un BC (ou laisser vide pour OT)"
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
              {!selectedBc && (
                <div>
                  <label className="block mb-1 text-sm font-semibold text-muted-foreground">Numéro OT</label>
                  <Input
                    name="numOt"
                    value={form.numOt}
                    onChange={handleChange}
                    required={!selectedBc}
                    placeholder="Numéro OT"
                  />
                </div>
              )}
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Division Projet</label>
                <Select value={form.divisionProjet} onValueChange={val => handleSelectChange('divisionProjet', val)}>
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
                <Input
                  name="codeProjet"
                  value={form.codeProjet}
                  onChange={handleChange}
                  required
                  placeholder="Code Projet"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Zone</label>
                <Select
                  value={form.zoneId ? String(form.zoneId) : ''}
                  onValueChange={val => handleSelectChange('zoneId', val)}
                  disabled={loadingZones}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingZones ? 'Chargement des zones...' : 'Choisir une zone'} />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z: Zone) => (
                      <SelectItem key={z.id} value={String(z.id)}>{z.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-semibold text-muted-foreground">Site</label>
                <Select
                  value={form.codeSite}
                  onValueChange={val => handleSelectChange('codeSite', val)}
                  disabled={loadingSites || !filteredSites.length}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingSites ? 'Chargement des sites...' : filteredSites.length === 0 ? 'Aucun site disponible' : 'Choisir un site'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSites.map((site: Site) => (
                      <SelectItem key={site.id} value={site.codesite}>
                        {site.codesite} ({site.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!selectedBc && (
                <>
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-muted-foreground">Date Go</label>
                    <Input name="dateGo" type="date" value={form.dateGo} onChange={handleChange} required />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">Prestations</h3>
                <Button type="button" variant="outline" onClick={handleAddPrestation}>
                  Ajouter Prestation
                </Button>
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
                      {selectedBc ? (
                        <div>
                          <label className="block mb-1 text-sm font-semibold text-muted-foreground">Prestation</label>
                          <Select
                            value={p.prestationId || ''}
                            onValueChange={val => handlePrestationChange(idx, 'prestationId', val)}
                            disabled={!selectedBc || loadingBcServices}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={bcPrestations.length === 0 ? 'Aucune prestation disponible' : 'Choisir une prestation'} />
                            </SelectTrigger>
                            <SelectContent>
                              {bcPrestations.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground">Aucune prestation disponible</div>
                              ) : (
                                bcPrestations.map((prest: PrestationSummary) => (
                                  <SelectItem key={prest.id} value={prest.id}>
                                    {prest.numLigne} - {prest.description} ({prest.famille})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block mb-1 text-sm font-semibold text-muted-foreground">Famille Projet</label>
                            <Select
                              value={p.famille || ''}
                              onValueChange={val => handlePrestationChange(idx, 'famille', val)}
                              disabled={loadingFamilles}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choisir une famille" />
                              </SelectTrigger>
                              <SelectContent>
                                {familleOptions.map((opt: Famille) => (
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
                              disabled={
                                loadingFamilles ||
                                loadingAllServices ||
                                !selectedFamilles[idx] ||
                                !getFilteredServices(selectedFamilles[idx]).length
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={
                                    !selectedFamilles[idx]
                                      ? "Sélectionner une famille d'abord"
                                      : getFilteredServices(selectedFamilles[idx]).length
                                      ? 'Choisir un service'
                                      : 'Aucun service disponible'
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {getFilteredServices(selectedFamilles[idx]).map((s: Service) => (
                                  <SelectItem key={s.id} value={String(s.id)}>
                                    {s.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block mb-1 text-sm font-semibold text-muted-foreground">Quantité Validée</label>
                        <Input
                          type="number"
                          value={p.quantiteValide}
                          onChange={e => handlePrestationChange(idx, 'quantiteValide', Number(e.target.value))}
                          required
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-sm font-semibold text-muted-foreground">Remarque</label>
                        <Input
                          value={p.remarque || ''}
                          onChange={e => handlePrestationChange(idx, 'remarque', e.target.value)}
                          placeholder="Remarque"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <Button type="submit" className="font-bold" disabled={isSubmitDisabled}>
                {isEditMode ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}