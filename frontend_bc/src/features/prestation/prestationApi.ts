import axios from 'axios';
import type { Prestation } from './types';

const apiUrl = import.meta.env.VITE_API_URL;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getPrestationsByBC(bcId: string): Promise<Prestation[]> {
  const res = await axios.get(`${apiUrl}/prestations/bon-de-commande/${bcId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getSuiviPrestationsByBackOfficeEmail(email: string) {
  const res = await axios.get(`${apiUrl}/suivi-prestations/back-office/${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
  console.log(res.data)
  return res.data;
}

export async function getSuiviPrestationsByCoordinatorEmail(email: string) {
  const res = await axios.get(`${apiUrl}/suivi-prestations/find/${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
  return res.data;
} 