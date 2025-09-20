import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SetPasswordPayload {
  token: string;
  password: string;
}

const SetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const mutation = useMutation({
    mutationFn: async (payload: SetPasswordPayload) => {
      console.log('Sending set-password payload:', payload);
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/users/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SetPassword error:', errorText, 'Status:', response.status);
        throw new Error(errorText || 'Failed to set password');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Password set successfully! Redirecting to login...');
      setPassword('');
      setConfirmPassword('');
      // Clear any session data to ensure clean redirect
      localStorage.removeItem('token');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      if (error.message.includes('expired')) {
        toast.error('This link has expired. Please contact your administrator.');
      } else if (error.message.includes('invalid')) {
        toast.error('Invalid link. Please use the link provided in your email.');
      } else {
        toast.error(error.message || 'Failed to set password');
      }
    },
  });

  const validateForm = () => {
    let isValid = true;
    setPasswordError('');
    setConfirmPasswordError('');

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (!token) {
      toast.error('Invalid or missing link. Please use the link provided in your email.');
      return;
    }
    if (mutation.isPending) return; // Prevent double submission
    mutation.mutate({ token, password });
  };

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="p-8 max-w-[98vw] mx-auto bg-gray-50 min-h-screen">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
            Set Your Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                New Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter new password"
                className="w-full"
                disabled={mutation.isPending}
              />
              {passwordError && (
                <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {passwordError}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError('');
                }}
                placeholder="Confirm new password"
                className="w-full"
                disabled={mutation.isPending}
              />
              {confirmPasswordError && (
                <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  {confirmPasswordError}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {mutation.isPending ? 'Setting Password...' : 'Set Password'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPassword;