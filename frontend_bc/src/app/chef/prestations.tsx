import { useQuery } from '@tanstack/react-query';
import { getAllPrestations } from '@/features/bon_de_commande/bcApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Building2, Eye, Package, MapPin, DollarSign, Search, Filter } from 'lucide-react';
import { UserInfoHover } from '@/components/shared/UserInfoHover';
import { PrestationsLoadingState, ErrorState } from '@/components/ui/loading-states';
import { useState, useMemo } from 'react';

export default function ChefPrestationsPage() {
  const { data: prestations, isLoading, error } = useQuery({
    queryKey: ['all-prestations'],
    queryFn: getAllPrestations,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [familleFilter, setFamilleFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  // Get unique families for filter
  const uniqueFamilies = useMemo(() => {
    if (!prestations) return [];
    const families = new Set<string>();
    prestations.forEach((prestation: any) => {
      if (prestation.famille) {
        families.add(prestation.famille);
      }
    });
    return Array.from(families).sort();
  }, [prestations]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!prestations) return [];

    return prestations.filter((prestation: any) => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        prestation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prestation.famille.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prestation.service?.description && prestation.service.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Family filter
      const familleMatch = familleFilter === 'all' || prestation.famille === familleFilter;

      // Price filter
      let priceMatch = true;
      if (priceFilter !== 'all') {
        const price = prestation.service?.prix || 0;
        switch (priceFilter) {
          case 'low':
            priceMatch = price <= 50;
            break;
          case 'medium':
            priceMatch = price > 50 && price <= 200;
            break;
          case 'high':
            priceMatch = price > 200;
            break;
        }
      }

      return searchMatch && familleMatch && priceMatch;
    });
  }, [prestations, searchTerm, familleFilter, priceFilter]);

  if (isLoading) {
    return <PrestationsLoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Calculate statistics
  const totalPrestations = prestations?.length || 0;
  const totalQuantity = prestations?.reduce((acc: number, p: any) => acc + (p.qteBc || 0), 0) || 0;
  const totalValue = prestations?.reduce((acc: number, p: any) => acc + ((p.qteBc || 0) * (p.service?.prix || 0)), 0) || 0;
  const uniqueFamiliesCount = new Set(prestations?.map((p: any) => p.famille)).size;

  return (
    <div className="min-h-screen w-full bg-background p-4">
      <div className="w-full space-y-6">
        {/* Header */}
        <Card className="shadow-2xl border border-accent/40 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-primary flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Toutes les Prestations
            </CardTitle>
            <p className="text-muted-foreground">
              Vue d'ensemble de toutes les prestations du projet
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {totalPrestations}
                </div>
                <div className="text-sm text-muted-foreground">Total Prestations</div>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {totalQuantity}
                </div>
                <div className="text-sm text-muted-foreground">Quantité Totale</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-500">
                  {totalValue.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Valeur Totale</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-2xl font-bold text-blue-500">
                  {uniqueFamiliesCount}
                </div>
                <div className="text-sm text-muted-foreground">Familles</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par ID, description, famille..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Famille</label>
                <Select value={familleFilter} onValueChange={setFamilleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les familles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les familles</SelectItem>
                    {uniqueFamilies.map((famille) => (
                      <SelectItem key={famille} value={famille}>
                        {famille}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prix</label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les prix" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les prix</SelectItem>
                    <SelectItem value="low">≤ 50 €</SelectItem>
                    <SelectItem value="medium">51 - 200 €</SelectItem>
                    <SelectItem value="high">{'>'} 200 €</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prestations List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Prestations ({filteredData.length} résultats)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Prestation</TableHead>
                  <TableHead>Famille</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData?.map((prestation: any) => (
                  <TableRow key={prestation.id}>
                    <TableCell className="font-medium">
                      <UserInfoHover 
                        backOffice={prestation.backOffice}
                        coordinateur={prestation.coordinateur}
                        title={`Prestation ${prestation.id}`}
                      >
                        <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors">{prestation.id}</Badge>
                      </UserInfoHover>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{prestation.famille}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {prestation.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {prestation.qteBc} {prestation.service?.unite}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {prestation.zone?.nom}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {prestation.service?.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {prestation.service?.prix} €
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/app/prestation/${prestation.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 