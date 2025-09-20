import type { UserRole } from '@/features/auth/authContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const backendToFrontendRole: Record<string, UserRole> = {
  coordinator: 'coordinateur',
  chef_projet: 'chef_projet',
  back_office: 'back_office',
  responsable_compte: 'responsable_compte',
};

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password,
      });
      const { token, userId, role, backOfficeId, email: responseEmail } = response.data;
      // Store token and user data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('email', responseEmail);
      localStorage.setItem('role', role);
      if (backOfficeId) {
        localStorage.setItem('backOfficeId', backOfficeId.toString());
      }

      // Construct user object
      const user = {
        id: email,
        name: email.split('@')[0],
        email,
        role: backendToFrontendRole[role.toLowerCase()] || role.toLowerCase(),
        backOfficeId: backOfficeId,
      };
      login(user);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full overflow-y-auto">
      <Card className="w-full max-w-sm shadow-2xl border border-accent/40 bg-card animate-fade-in-up">
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold tracking-tight text-primary">Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-destructive text-sm font-semibold">{error}</div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus className="bg-input text-foreground border border-border" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-input text-foreground border border-border" />
            </div>
            <Button type="submit" className="w-full text-lg font-bold tracking-wide shadow-md bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary transition-all duration-200" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}