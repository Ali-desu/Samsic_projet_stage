export interface Prestation {
  id: string;
  numLigne: number;
  description: string;
  fournisseur: string;
  qteBc: number;
  famille?: string;
  service?: {
    id: number;
    description: string;
  };
}

export type SuiviPrestation = {
  prestation_id: string;
  coord_id: string;
  qte_realise: number;
  qte_encours: number;
  qte_tech: number;
  qte_depose: number;
  qte_a_depose: number;
  qte_sys: number;
  zone_id: string;
  site: string;
  fournisseur: string;
  date_planifiee: string;
  date_go: string;
  date_debut: string;
  date_fin: string;
  date_realisation: string;
  date_recep_tech: string;
  date_pf: string;
  date_recep_sys: string;
  remarque: string;
  delai_recep: string;
}; 