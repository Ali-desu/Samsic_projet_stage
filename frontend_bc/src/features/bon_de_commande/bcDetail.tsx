import { useQuery } from '@tanstack/react-query';
import { getBC } from './bcApi';
import type { BonDeCommande } from './types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrestationsByBC } from '../../features/prestation/prestationApi';
import { ArrowLeft, FileText, Calendar, Hash, Building, User } from 'lucide-react';

export default function BCDetail() {
  const navigate = useNavigate();
  const { numBc } = useParams<{ numBc: string }>();

  const { data: bc, isLoading, error } = useQuery<BonDeCommande | undefined>({
    queryKey: ['bc', numBc],
    queryFn: () => getBC(numBc!),
    enabled: !!numBc,
  });

  const { data: prestations = [], isLoading: loadingPrestations } = useQuery({
    queryKey: ['prestations', bc?.numBc],
    queryFn: () => getPrestationsByBC(bc!.numBc),
    enabled: !!bc,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={36} className="text-destructive" />
          </div>
          <div className="text-xl font-semibold text-foreground">Erreur: {error.message}</div>
        </div>
      </div>
    );
  }

  if (!bc) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-background">
        <div className="text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={36} className="text-muted-foreground" />
          </div>
          <div className="text-xl font-semibold text-foreground">Bon de Commande introuvable.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 sm:p-8 bg-background max-w-[98vw] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="default"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft size={20} />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-primary-foreground" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Détail du Bon de Commande
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 bg-primary rounded"></div>
                Informations Générales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-muted/20 rounded-lg p-6 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Hash size={20} className="text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Numéro BC</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground">{bc.numBc}</div>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-6 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Building size={20} className="text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Division Projet</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground">{bc.divisionProjet}</div>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-6 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Code Projet</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground">{bc.codeProjet}</div>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-6 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar size={20} className="text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Date Édition</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground">{bc.dateEdition}</div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-muted/20 rounded-lg p-6 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <Hash size={20} className="text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Num Projet Facturation</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground">{bc.numProjetFacturation}</div>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-6 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText size={20} className="text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Num PV Réception</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground">{bc.numPvReception}</div>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-6 border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <User size={20} className="text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Back Office ID</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground">{bc.backOfficeId}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prestations Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-8 h-8 bg-primary rounded"></div>
                Prestations liées
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <AnimatePresence initial={false}>
                {loadingPrestations ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-base text-muted-foreground">Chargement des prestations...</div>
                  </motion.div>
                ) : prestations.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText size={36} className="text-muted-foreground" />
                    </div>
                    <div className="text-base text-muted-foreground">Aucune prestation liée.</div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 8 }}
                    className="space-y-4"
                  >
                    {prestations.map((p, index) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-muted/20 border border-border rounded-lg p-5 hover:bg-muted/30 transition-colors duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="text-base font-semibold text-foreground mb-1">{p.description}</div>
                            <div className="text-base text-muted-foreground">
                              {p.qteBc} x {p.service?.description || 'Service'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prestations Table */}
      {prestations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Détail des Prestations</CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50 h-14">
                  <TableHead className="text-lg font-semibold text-foreground p-4">ID</TableHead>
                  <TableHead className="text-lg font-semibold text-foreground p-4">Num Ligne</TableHead>
                  <TableHead className="text-lg font-semibold text-foreground p-4">Description</TableHead>
                  <TableHead className="text-lg font-semibold text-foreground p-4">Quantité BC</TableHead>
                  <TableHead className="text-lg font-semibold text-foreground p-4">Service</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestations.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50 h-14">
                    <TableCell className="text-lg font-medium text-foreground p-4">{p.id}</TableCell>
                    <TableCell className="text-lg font-medium text-foreground p-4">{p.numLigne}</TableCell>
                    <TableCell className="text-lg font-medium text-foreground p-4">{p.description}</TableCell>
                    <TableCell className="text-lg font-medium text-foreground p-4">{p.qteBc}</TableCell>
                    <TableCell className="text-lg font-medium text-foreground p-4">{p.service?.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}