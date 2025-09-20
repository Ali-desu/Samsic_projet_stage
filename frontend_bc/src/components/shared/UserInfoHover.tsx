import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building2 } from 'lucide-react';

interface UserInfo {
  id: number;
  user: {
    id: number;
    nom: string;
    email: string;
    role: string;
  };
}

interface UserInfoHoverProps {
  children: React.ReactNode;
  backOffice?: UserInfo;
  coordinateur?: UserInfo;
  title?: string;
}

export function UserInfoHover({ children, backOffice, coordinateur, title }: UserInfoHoverProps) {
  const [open, setOpen] = useState(false);
  console.log('UserInfoHover', { backOffice, coordinateur, children });
  const hasUserInfo = backOffice || coordinateur;

  if (!hasUserInfo) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer inline-block">
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          {title && (
            <div className="font-semibold text-sm border-b pb-2">
              {title}
            </div>
          )}
          
          {backOffice && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <Badge variant="outline" className="text-xs">Back Office</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{backOffice.user.nom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{backOffice.user.email}</span>
                </div>
              </div>
            </div>
          )}

          {coordinateur && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                <Badge variant="outline" className="text-xs">Coordinateur</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{coordinateur.user.nom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{coordinateur.user.email}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 