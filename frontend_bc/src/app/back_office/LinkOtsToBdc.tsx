
import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@/features/auth/authContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { format } from 'date-fns';

// Interfaces
interface ZoneResponse {
  id: number;
  name: string;
}

interface OTResponse {
  numOt: string;
  divisionProjet: string;
  codeProjet: string;
  zone: ZoneResponse;
  dateGo: string;
  backOffice: {
    id: number;
  };
}

interface BDCResponse {
  numBc: string;
  divisionProjet: string;
  codeProjet: string;
  dateEdition: string;
}

interface LinkOtToBdcRequest {
  numOt: string;
  numBc: string;
}

// Columns for OT table
interface Column {
  key: keyof OTResponse | 'zoneName';
  label: string;
  type?: 'date';
}

const columns: Column[] = [
  { key: 'numOt', label: 'Num OT' },
  { key: 'divisionProjet', label: 'Division Projet' },
  { key: 'codeProjet', label: 'Code Projet' },
  { key: 'zoneName', label: 'Zone' },
  { key: 'dateGo', label: 'Date GO', type: 'date' },
];

// Fetch functions
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const fetchOTs = async (email: string): Promise<OTResponse[]> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.get(`${apiUrl}/ots/${encodeURIComponent(email)}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

const fetchBDCs = async (email: string): Promise<BDCResponse[]> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.get(`${apiUrl}/bon-de-commande/find/${encodeURIComponent(email)}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

const linkOtToBdc = async (data: LinkOtToBdcRequest): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const response = await axios.post(`${apiUrl}/ots/link`, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Component
const LinkOtToBdc: React.FC = () => {
  const { user } = useAuth();
  const userEmail = user?.email || '';
  const [selectedOt, setSelectedOt] = useState<OTResponse | null>(null);
  const [selectedBdc, setSelectedBdc] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch OTs
  const { data: ots = [], isLoading: isLoadingOTs, error: errorOTs } = useQuery<OTResponse[], Error>({
    queryKey: ['ots', userEmail],
    queryFn: () => fetchOTs(userEmail),
    enabled: !!userEmail,
  });

  // Fetch BDCs
  const { data: bdcs = [], isLoading: isLoadingBDCs, error: errorBDCs } = useQuery<BDCResponse[], Error>({
    queryKey: ['bdcs', userEmail],
    queryFn: () => fetchBDCs(userEmail),
    enabled: !!userEmail,
  });

  // Link OT to BDC mutation
  const linkMutation = useMutation<void, Error, LinkOtToBdcRequest>({
    mutationFn: linkOtToBdc,
    onSuccess: () => {
      setStatus({ type: 'success', message: `OT ${selectedOt?.numOt} linked to BDC ${selectedBdc}` });
      setSelectedOt(null);
      setSelectedBdc('');
      setTimeout(() => setStatus(null), 3000);
    },
    onError: (error) => {
      const message = error.message.includes('IllegalArgumentException')
        ? 'No matching Prestation found for this OT and BDC'
        : 'Failed to link OT to BDC';
      setStatus({ type: 'error', message });
      setTimeout(() => setStatus(null), 3000);
    },
  });

  // Filter OTs based on search term
  const filteredOts = useMemo(() => {
    if (!searchTerm) return ots;
    return ots.filter(ot =>
      ot.numOt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.divisionProjet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.codeProjet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ot.zone.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ots, searchTerm]);

  const handleLink = () => {
    if (selectedOt && selectedBdc) {
      linkMutation.mutate({ numOt: selectedOt.numOt, numBc: selectedBdc });
    }
  };

  const formatCellValue = (ot: OTResponse, column: Column): React.ReactNode => {
    if (column.key === 'zoneName') {
      return ot.zone?.name || <span className="text-muted-foreground">-</span>;
    }
    const value = ot[column.key as keyof OTResponse];
    if (column.type === 'date' && value) {
      try {
        return format(new Date(value as string), 'dd/MM/yyyy');
      } catch {
        return String(value);
      }
    }
    if (typeof value === 'object' && value !== null) {
      return <span className="text-muted-foreground">-</span>;
    }
    return value ?? <span className="text-muted-foreground">-</span>;
  };

  if (isLoadingOTs || isLoadingBDCs) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-semibold text-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  if (errorOTs || errorBDCs) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center bg-card p-8 rounded-lg shadow-md border border-border">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <div className="text-xl font-semibold text-destructive mb-2">Erreur</div>
          <div className="text-muted-foreground mb-4">{String(errorOTs || errorBDCs)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[98vw] mx-auto bg-background min-h-screen">
      <div className="space-y-6">
        <div className="card bg-card rounded-lg shadow-sm p-6 border border-border">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Lier OT à BDC</h1>
          <p className="text-muted-foreground mb-4">Associer des Ordres de Travail à des Bons de Commande</p>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher OTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
            />
          </div>
          {status && (
            <div className={`card border-l-4 p-4 mb-6 ${status.type === 'success' ? 'border-primary bg-primary/5 status-success' : 'border-destructive bg-destructive/5 status-error'}`}>
              <div className="flex items-center gap-2">
                {status.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                )}
                <span className="text-sm text-foreground">{status.message}</span>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-muted border-b-2 border-border">
                  {columns.map(col => (
                    <th key={col.key} className="text-left py-4 px-4 font-semibold text-foreground border-r border-border">
                      {col.label}
                    </th>
                  ))}
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOts.length > 0 ? (
                  filteredOts.map((ot, index) => (
                    <tr
                      key={ot.numOt}
                      className={`hover:bg-accent transition-all duration-200 border-b border-border ${index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}`}
                    >
                      {columns.map(col => (
                        <td key={col.key} className="py-3 px-4 border-r border-border">
                          <div className="max-w-[200px] truncate" title={String(ot[col.key as keyof OTResponse] || ot.zone?.name || '')}>
                            {formatCellValue(ot, col)}
                          </div>
                        </td>
                      ))}
                      <td className="py-3 px-4">
                        <Dialog open={selectedOt?.numOt === ot.numOt} onOpenChange={(open) => setSelectedOt(open ? ot : null)}>
                          <DialogTrigger asChild>
                            <Button variant="default" size="sm">
                              Convertir
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border border-border shadow-lg">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Lier OT {ot.numOt} à un BDC</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-muted-foreground">OT: {ot.numOt}</p>
                              <div>
                                <label className="text-sm font-medium text-foreground">Sélectionner un Bon de Commande</label>
                                <select
                                  value={selectedBdc}
                                  onChange={(e) => setSelectedBdc(e.target.value)}
                                  className="w-full mt-2 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                  disabled={linkMutation.isPending}
                                >
                                  <option value="">Choisir un BDC</option>
                                  {bdcs.map(bdc => (
                                    <option key={bdc.numBc} value={bdc.numBc}>
                                      {bdc.numBc} - {bdc.divisionProjet} ({format(new Date(bdc.dateEdition), 'dd/MM/yyyy')})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedOt(null)}
                                  disabled={linkMutation.isPaused}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  variant="default"
                                  onClick={handleLink}
                                  disabled={!selectedBdc || linkMutation.isPending}
                                >
                                  {linkMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Lier'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-4">
                        <Search className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <div className="text-lg font-semibold mb-1">Aucun OT trouvé</div>
                          <div className="text-sm">Essayez d'ajuster votre recherche</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkOtToBdc;
