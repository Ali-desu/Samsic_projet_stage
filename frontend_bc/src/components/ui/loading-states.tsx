import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, FileText, Building2, TrendingUp } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function LoadingState({ 
  title = "Chargement...", 
  message = "Veuillez patienter pendant le chargement des données.",
  icon = <Loader2 className="h-8 w-8 animate-spin" />
}: LoadingStateProps) {
  return (
    <div className="min-h-screen w-full bg-background p-4">
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md shadow-2xl border border-accent/40 bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {icon}
            </div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">{message}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Erreur", 
  message = "Une erreur s'est produite lors du chargement des données.",
  error,
  onRetry
}: ErrorStateProps) {
  return (
    <div className="min-h-screen w-full bg-background p-4">
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md shadow-2xl border border-red-200 bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-xl font-bold text-red-600">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">{message}</p>
            {error && process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Détails de l'erreur</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
            {onRetry && (
              <button 
                onClick={onRetry}
                className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold shadow-md hover:from-accent hover:to-primary transition-all duration-200 px-4 py-2 rounded"
              >
                Réessayer
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ 
  title = "Aucune donnée", 
  message = "Aucune donnée trouvée pour les critères sélectionnés.",
  icon = <FileText className="h-8 w-8 text-muted-foreground" />,
  action
}: EmptyStateProps) {
  return (
    <div className="min-h-screen w-full bg-background p-4">
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md shadow-2xl border border-accent/40 bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {icon}
            </div>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center">{message}</p>
            {action && (
              <div className="flex justify-center">
                {action}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Specific loading states for different contexts
export function BCsLoadingState() {
  return (
    <LoadingState 
      title="Chargement des Bons de Commande"
      message="Récupération des données des bons de commande..."
      icon={<FileText className="h-8 w-8 animate-pulse" />}
    />
  );
}

export function PrestationsLoadingState() {
  return (
    <LoadingState 
      title="Chargement des Prestations"
      message="Récupération des données des prestations..."
      icon={<Building2 className="h-8 w-8 animate-pulse" />}
    />
  );
}

export function SuiviLoadingState() {
  return (
    <LoadingState 
      title="Chargement des Suivis"
      message="Récupération des données de suivi..."
      icon={<TrendingUp className="h-8 w-8 animate-pulse" />}
    />
  );
} 