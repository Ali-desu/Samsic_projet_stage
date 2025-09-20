import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllBCs, updateBC, deleteBC, getBCFile } from '@/features/bon_de_commande/bcApi';
import type { BonDeCommande } from '@/features/bon_de_commande/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { FileText, Edit, Trash, File, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BCsLoadingState, ErrorState } from '@/components/ui/loading-states';

export default function ChefBCPage() {
  const queryClient = useQueryClient();
  const [editBC, setEditBC] = useState<Partial<BonDeCommande> | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState<'default' | 'destructive'>('default');

  const { data: bcs = [], isLoading, error } = useQuery({
    queryKey: ['all-bcs'],
    queryFn: getAllBCs,
  });

  const updateMutation = useMutation({
    mutationFn: ({ numBc, updated }: { numBc: string; updated: Partial<BonDeCommande> }) =>
      updateBC(numBc, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-bcs'] });
      setAlertMessage('Bon de Commande mis à jour.');
      setAlertVariant('default');
      setShowAlert(true);
      setIsEditDialogOpen(false);
      setEditBC(null);
    },
    onError: (error: any) => {
      setAlertMessage(error.message || 'Échec de la mise à jour du Bon de Commande.');
      setAlertVariant('destructive');
      setShowAlert(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBC,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-bcs'] });
      setAlertMessage('Bon de Commande supprimé.');
      setAlertVariant('default');
      setShowAlert(true);
    },
    onError: (error: any) => {
      setAlertMessage(error.message || 'Échec de la suppression du Bon de Commande.');
      setAlertVariant('destructive');
      setShowAlert(true);
    },
  });

  const handleEdit = (bc: BonDeCommande) => {
    setEditBC({
      numBc: bc.numBc,
      divisionProjet: bc.divisionProjet,
      codeProjet: bc.codeProjet,
      dateEdition: bc.dateEdition,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editBC?.numBc) {
      updateMutation.mutate({ numBc: editBC.numBc, updated: editBC });
    }
  };

  const handleDelete = (numBc: string) => {
    deleteMutation.mutate(numBc);
  };

  const handleViewFile = async (numBc: string) => {
    try {
      const url = await getBCFile(numBc);
      setFileUrl(url);
      setIsFileDialogOpen(true);
    } catch (error: any) {
      setAlertMessage(error.message || 'Échec du chargement du fichier.');
      setAlertVariant('destructive');
      setShowAlert(true);
    }
  };

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  // Clean up file URL when file dialog closes
  useEffect(() => {
    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
    };
  }, [fileUrl]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return <BCsLoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-background max-w-[98vw] mx-auto">
      {/* Alert for feedback */}
      {showAlert && (
        <Alert variant={alertVariant} className="mb-6">
          {alertVariant === 'default' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{alertVariant === 'default' ? 'Succès' : 'Erreur'}</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-primary">
            <FileText className="h-8 w-8" />
            Bons de Commande
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50 h-12">
                <TableHead className="text-sm font-semibold text-foreground p-3">Numéro BC</TableHead>
                <TableHead className="text-sm font-semibold text-foreground p-3">Division Projet</TableHead>
                <TableHead className="text-sm font-semibold text-foreground p-3">Code Projet</TableHead>
                <TableHead className="text-sm font-semibold text-foreground p-3">Date Édition</TableHead>
                <TableHead className="text-sm font-semibold text-foreground p-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bcs.map((bc) => (
                <TableRow key={bc.numBc} className="hover:bg-muted/50 h-12">
                  <TableCell className="text-sm font-medium text-foreground p-3">{bc.numBc}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground p-3">{bc.divisionProjet || '-'}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground p-3">{bc.codeProjet || '-'}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground p-3">{formatDate(bc.dateEdition)}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground p-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => handleEdit(bc)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-3">
                            <Trash className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer le Bon de Commande {bc.numBc} ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <DialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(bc.numBc)}>
                              Supprimer
                            </AlertDialogAction>
                          </DialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => handleViewFile(bc.numBc)}
                      >
                        <File className="h-4 w-4 mr-2" />
                        Visualiser
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier Bon de Commande</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm text-right font-medium">Numéro BC</label>
              <Input
                className="col-span-3"
                value={editBC?.numBc || ''}
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm text-right font-medium">Division Projet</label>
              <Input
                className="col-span-3"
                value={editBC?.divisionProjet || ''}
                onChange={(e) => setEditBC({ ...editBC!, divisionProjet: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm text-right font-medium">Code Projet</label>
              <Input
                className="col-span-3"
                value={editBC?.codeProjet || ''}
                onChange={(e) => setEditBC({ ...editBC!, codeProjet: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-sm text-right font-medium">Date Édition</label>
              <Input
                className="col-span-3"
                type="date"
                value={editBC?.dateEdition || ''}
                onChange={(e) => setEditBC({ ...editBC!, dateEdition: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <Dialog open={isFileDialogOpen} onOpenChange={(open) => {
        setIsFileDialogOpen(open);
        if (!open && fileUrl) {
          window.URL.revokeObjectURL(fileUrl);
          setFileUrl(null);
        }
      }}>
        <DialogContent className="sm:max-w-[80vw] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Fichier Bon de Commande</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {fileUrl ? (
              <iframe
                src={fileUrl}
                className="w-full h-[60vh] border border-border rounded"
                title="Bon de Commande File"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Chargement du fichier...</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFileDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}