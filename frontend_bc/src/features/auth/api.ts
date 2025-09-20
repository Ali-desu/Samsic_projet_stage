import axios from 'axios';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
const apiUrl = import.meta.env.VITE_API_URL;

export async function getUserIdByEmail(email: string): Promise<number> {
  const res = await axios.get(`${apiUrl}/users/id-by-email/${encodeURIComponent(email)}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getNotificationsByUserId(userId: number) {
  const res = await axios.get(`${apiUrl}/notifications/${userId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function getUnreadNotificationsByUserId(userId: number) {
  const res = await axios.get(`${apiUrl}/notifications/unread/${userId}`, { headers: getAuthHeaders() });
  return res.data;
}

export async function markNotificationAsRead(notificationId: number) {
  const res = await axios.put(`${apiUrl}/notifications/read/${notificationId}`, {}, { headers: getAuthHeaders() });
  return res.data;
}
