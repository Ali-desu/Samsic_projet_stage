import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/authContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserCreationPayload {
  email: string;
  nom: string;
  role: 'CHEF_PROJET' | 'COORDINATEUR' | 'BACK_OFFICE';
  zoneId?: number; // Optional, for COORDINATEUR
}

interface Zone {
  id: number;
  nom: string;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [role, setRole] = useState<UserCreationPayload['role'] | ''>('');
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [emailError, setEmailError] = useState('');
  const [nomError, setNomError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [zoneError, setZoneError] = useState('');

  // Check if user exists
  const { data: userId, isLoading: isUserLoading, error: userError } = useQuery({
    queryKey: ['userId', user?.email],
    queryFn: async () => {
      if (!user?.email) throw new Error('No user email');
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/users/id-by-email/${user.email}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch user ID');
      return response.json();
    },
    enabled: !!user?.email,
  });

  // Fetch zones
  const { data: zones, isLoading: isZonesLoading, error: zonesError } = useQuery<Zone[], Error>({
    queryKey: ['zones'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token d\'authentification non trouvé');
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/zones`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      return response.json();
    },
  });

  // Reset zoneId when role changes to non-COORDINATEUR
  useEffect(() => {
    if (role !== 'COORDINATEUR') {
      setZoneId('');
      setZoneError('');
    }
  }, [role]);

  const mutation = useMutation({
    mutationFn: async (payload: UserCreationPayload) => {
      console.log('Sending payload:', payload);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText, 'Status:', response.status);
        throw new Error(errorText || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('User created successfully! A secure link has been sent to their email.');
      setEmail('');
      setNom('');
      setRole('');
      setZoneId('');
      setEmailError('');
      setNomError('');
      setRoleError('');
      setZoneError('');
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error(error.message || 'Failed to create user');
    },
  });

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setNomError('');
    setRoleError('');
    setZoneError('');

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      isValid = false;
    }

    if (!nom) {
      setNomError('Name is required');
      isValid = false;
    }

    if (!role) {
      setRoleError('Role is required');
      isValid = false;
    }

    if (role === 'COORDINATEUR' && !zoneId) {
      setZoneError('Zone is required for Coordinateur');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (mutation.isPending) return;
    const payload: UserCreationPayload = {
      email,
      nom,
      role: role as UserCreationPayload['role'],
    };
    if (role === 'COORDINATEUR' && zoneId) {
      payload.zoneId = Number(zoneId);
    }
    mutation.mutate(payload);
  };

  if (isUserLoading || isZonesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userError || !userId) {
    return <Navigate to="/not-authorized" replace />;
  }

  // Mock CHEF_PROJET check (replace with actual role check)
  const isChefProjet = true; // TODO: Fetch role from /api/users/me

  if (!isChefProjet) {
    return <Navigate to="/not-authorized" replace />;
  }

  return (
    <div className="p-8 max-w-[98vw] mx-auto bg-gray-50 min-h-screen">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <UserPlus size={20} className="text-white" />
            </div>
            Create New User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="Enter user email"
                className="w-full"
                disabled={mutation.isPending}
              />
              {emailError && (
                <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {emailError}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Name
              </label>
              <Input
                type="text"
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  setNomError('');
                }}
                placeholder="Enter user name"
                className="w-full"
                disabled={mutation.isPending}
              />
              {nomError && (
                <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {nomError}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Role
              </label>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value as UserCreationPayload['role']);
                  setRoleError('');
                }}
                disabled={mutation.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHEF_PROJET">Chef de Projet</SelectItem>
                  <SelectItem value="COORDINATEUR">Coordinateur</SelectItem>
                  <SelectItem value="BACK_OFFICE">Back Office</SelectItem>
                </SelectContent>
              </Select>
              {roleError && (
                <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {roleError}
                </div>
              )}
            </div>
            {role === 'COORDINATEUR' && (
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Zone
                </label>
                <Select
                  value={zoneId ? String(zoneId) : ''}
                  onValueChange={(value) => {
                    setZoneId(value ? Number(value) : '');
                    setZoneError('');
                  }}
                  disabled={mutation.isPending || isZonesLoading || !!zonesError}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isZonesLoading ? 'Loading zones...' : zonesError ? 'Error loading zones' : 'Select a zone'} />
                  </SelectTrigger>
                  <SelectContent>
                    {zones?.map((zone) => (
                      <SelectItem key={zone.id} value={String(zone.id)}>
                        {zone.nom || `Zone ${zone.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {zoneError && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {zoneError}
                  </div>
                )}
                {zonesError && (
                  <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    Failed to load zones
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEmail('');
                  setNom('');
                  setRole('');
                  setZoneId('');
                  setEmailError('');
                  setNomError('');
                  setRoleError('');
                  setZoneError('');
                }}
                disabled={mutation.isPending}
              >
                Reset
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {mutation.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;