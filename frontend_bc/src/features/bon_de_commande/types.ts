

interface UserInfo {
  id: number;
  user: {
    id: number;
    nom: string;
    email: string;
    role: string;
  };
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
  backOffice?: UserInfo;
  prestations: Prestation[];
  isOt?: boolean;
  bc_file?: string; // Backend returns this as a string (base64 or file path)
  [key: string]: any; // Index signature for dynamic access
}

export interface Prestation {
  id?: string;
  numLigne: number;
  description: string;
  quantiteValide: number;
  qteBc: number;
  serviceId: string | number;
  zoneId?: string | number;
  famille: string;
  codeSite?: string;
  fournisseur?: string;
  remarque?: string;
}


export interface PrestationWithUsers extends Prestation {
  backOffice?: UserInfo;
  coordinateur?: UserInfo;
}

export interface SuiviPrestationWithUsers {
  id: number;
  prestation: Prestation;
  coordinateurId: number;
  coordinateur?: UserInfo;
  qteRealise: number;
  qteEncours: number;
  qteTech: number;
  qteDepose: number;
  qteADepose: number;
  qteSys: number;
  zone: { id: number; name: string };
  site: string | null;
  fournisseurName: string | null;
  datePlanifiee: string | null;
  dateGo: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateRealisation: string;
  dateRecepTech: string;
  datePf: string | null;
  dateRecepSys: string | null;
  remarque: string;
  delaiRecep: number;
}



// Add more types as needed for future features 