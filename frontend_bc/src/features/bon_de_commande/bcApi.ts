import axios from 'axios';
import type { BonDeCommande } from './types';

const apiUrl = import.meta.env.VITE_API_URL;
const API_URL = `${apiUrl}/bon-de-commande`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getBCs = async (email: string): Promise<BonDeCommande[]> => {
  const res = await axios.get(`${apiUrl}/bon-de-commande/find/${email}`, { headers: getAuthHeaders() });
  return res.data;
};

export async function getBC(num_bc: string): Promise<BonDeCommande | undefined> {
  const res = await axios.get(`${apiUrl}/bon-de-commande/${num_bc}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function addBC(bc: BonDeCommande): Promise<void> {
  await axios.post(API_URL, bc, { headers: getAuthHeaders() });
}

export async function updateBC(num_bc: string, updated: Partial<BonDeCommande>): Promise<void> {
  await axios.put(`${API_URL}/${num_bc}`, updated, { headers: getAuthHeaders() });
}

export async function deleteBC(num_bc: string): Promise<void> {
  await axios.delete(`${API_URL}/${num_bc}`, { headers: getAuthHeaders() });
}

export async function getBCFile(num_bc: string): Promise<string> {
  try {
    const res = await axios.get(`${API_URL}/${num_bc}/file`, {
      headers: getAuthHeaders(),
      responseType: 'blob', // Handle binary file response
    });
    
    const contentType = res.headers['content-type'] || 'application/pdf';
    
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    return url;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch file');
  }
}

export async function getServices() {
  const res = await axios.get(`${apiUrl}/services`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getZones() {
  const res = await axios.get(`${apiUrl}/zones`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllBCs(): Promise<BonDeCommande[]> {
  const res = await axios.get(API_URL, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllPrestations(): Promise<SuiviPrestationResponse[]> {
  const res = await axios.get(`${apiUrl}/prestations`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllSuiviPrestations(): Promise<SuiviPrestationResponse[]> {
  const res = await axios.get(`${apiUrl}/suivi-prestations`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getAllSuiviPrestationsByBackOfficeEmail(email: string): Promise<SuiviPrestationResponse[]> {
  try {
    const res = await axios.get(`${apiUrl}/suivi-prestations/back-office/${encodeURIComponent(email)}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error: any) {
    console.error('Error fetching suivi prestations:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch suivi prestations');
  }
}

export async function getChefNotifications(email: string) {
  const res = await axios.get(`${apiUrl}/notifications/chef?email=${encodeURIComponent(email)}`, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

interface FileResponse {
  id: number;
  name: string;
  contentType: string;
}

interface ZoneResponse {
  id: number;
  name: string;
}

interface ServiceResponse {
  id: number;
  nomService: string;
  prix: number;
}

interface PrestationResponse {
  id: string;
  numLigne: number;
  description: string;
  qteBc: number;
  famille: string;
  zone: ZoneResponse;
  service: ServiceResponse;
}

interface SuiviPrestationResponse {
  id: number;
  prestation: PrestationResponse;
  coordinateurId: number;
  zone: ZoneResponse;
  qteRealise: number;
  qteEncours: number;
  qteTech: number;
  qteDepose: number;
  qteADepose: number;
  qteSys: number;
  fournisseur: string;
  datePlanifiee: string | null;
  dateGo: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateRealisation: string | null;
  statutDeRealisation: string | null;
  dateRecepTech: string | null;
  statutReceptionTech: string | null;
  datePf: string | null;
  dateRecepSys: string | null;
  statutReceptionSystem: string | null;
  remarque: string | null;
  delaiRecep: number;
  bc_num: string;
  site : string;
  dateEdition: string;
  fichierReceptionTech: FileResponse | null;
  error: string | null;
  ot: boolean;
}