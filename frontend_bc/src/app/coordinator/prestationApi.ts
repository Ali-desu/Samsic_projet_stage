export const getSuiviPrestationsByEmail = async (email: string): Promise<any[]> => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const response = await fetch(`${apiUrl}/suivi-prestations/find/${email}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch suivi prestations');
    }
    return response.json();
  };