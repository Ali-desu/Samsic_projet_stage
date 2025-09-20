import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Inbox, 
  FileText, 
  Building2, 
  LogOut, 
  ChevronDown, 
  Database,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/features/auth/authContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/themeToggle";
import { useQuery } from "@tanstack/react-query";
import { getUserIdByEmail, getUnreadNotificationsByUserId } from "@/features/auth/api";

export type NavbarMenuItem = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  roles?: string[];
  badge?: React.ReactNode;
  subItems?: NavbarMenuItem[];
};

const defaultMenu: NavbarMenuItem[] = [
  { 
    label: 'Tableau de Bord', 
    icon: <Home className="h-4 w-4" />, 
    href: '/app/dashboard' 
  },
  { 
    label: 'Boîte de Réception', 
    icon: <Inbox className="h-4 w-4" />, 
    href: '/app/inbox', 
    badge: <span className="ml-2 bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">0</span> 
  },
  { 
    label: 'Base de Données', 
    icon: <Database className="h-4 w-4" />, 
    subItems: [
      { 
        label: 'BOQ', 
        icon: <FileText className="h-4 w-4" />, 
        href: '/app/back_office/boq', 
        roles: ['back_office', 'responsable_compte', 'chef_projet'] 
      },
      { 
        label: 'Sites', 
        icon: <Building2 className="h-4 w-4" />, 
        href: '/app/back_office/sites', 
        roles: ['back_office', 'responsable_compte', 'chef_projet'] 
      }
    ],
    roles: ['back_office', 'chef_projet']
  },
  { 
    label: 'Résumé BC', 
    icon: <FileText className="h-4 w-4" />, 
    href: '/app/back_office/bcresume', 
    roles: ['back_office', 'responsable_compte'] 
  },
  { 
    label: 'Résumé OT', 
    icon: <FileText className="h-4 w-4" />, 
    href: '/app/back_office/link', 
    roles: ['back_office', 'responsable_compte'] 
  },
  { 
    label: 'Ajouter Employé', 
    icon: <FileText className="h-4 w-4" />, 
    href: '/app/chef/add-user', 
    roles: ['chef_projet'] 
  },
  {
    label: 'Détails BC',
    icon: <FileText className="h-4 w-4" />,
    href: '/app/back_office/bcdetail',
    roles: ['back_office']
  },
  { 
    label: 'Suivi Réalisation', 
    icon: <Building2 className="h-4 w-4" />, 
    href: '/app/coordinator/suivi', 
    roles: ['coordinateur'] 
  },
  { 
    label: 'Suivis', 
    icon: <Building2 className="h-4 w-4" />, 
    href: '/app/back_office/prestations', 
    roles: ['back_office'] 
  },
  { 
    label: 'Tous les BC', 
    icon: <FileText className="h-4 w-4" />, 
    href: '/app/chef/bc', 
    roles: ['chef_projet'] 
  },
  { 
    label: 'Résumé BC', 
    icon: <FileText className="h-4 w-4" />, 
    href: '/app/chef/resumett', 
    roles: ['chef_projet'] 
  },
  { 
    label: 'Détails BC', 
    icon: <FileText className="h-4 w-4" />, 
    href: '/app/chef/detailstt', 
    roles: ['chef_projet'] 
  },
  { 
    label: 'Tous les Suivis', 
    icon: <TrendingUp className="h-4 w-4" />, 
    href: '/app/chef/suivi', 
    roles: ['chef_projet'] 
  }
];

export function ModernNavbar({ menu = defaultMenu }: { menu?: NavbarMenuItem[] }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const { data: userId } = useQuery({
    queryKey: ['userId', user?.email],
    queryFn: () => user?.email ? getUserIdByEmail(user.email) : Promise.reject('No email'),
    enabled: !!user?.email,
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', userId],
    queryFn: () => typeof userId === 'number' ? getUnreadNotificationsByUserId(userId) : Promise.resolve([]),
    enabled: typeof userId === 'number',
  });

  const filteredMenu = menu
    .filter(item => !item.roles || (user && item.roles.includes(user.role)))
    .map(item => {
      if (item.label === 'Boîte de Réception') {
        return {
          ...item,
          badge: unreadNotifications.length > 0 ? (
            <span className="ml-2 bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-medium">
              {unreadNotifications.length}
            </span>
          ) : null
        };
      }
      if (item.subItems) {
        return {
          ...item,
          subItems: item.subItems.filter(subItem => 
            !subItem.roles || (user && subItem.roles.includes(user.role))
          )
        };
      }
      return item;
    });

  return (
    <nav className="bg-background border-b shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          {/* <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BC</span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-semibold text-sm tracking-tight">Samsic</h2>
                <p className="text-xs text-muted-foreground">Système de Gestion</p>
              </div>
            </div>
          </div> */}

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-4">
            {filteredMenu.map(item => {
              const isActive = item.href ? location.pathname.startsWith(item.href) : false;
              return (
                <div key={item.label} className="relative">
                  {item.subItems ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "flex items-center gap-2 text-sm font-medium",
                            isActive && "bg-accent text-accent-foreground"
                          )}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {item.subItems.map(subItem => (
                          <DropdownMenuItem key={subItem.label} asChild>
                            <Link
                              to={subItem.href!}
                              className={cn(
                                "flex items-center gap-2",
                                location.pathname.startsWith(subItem.href!) && "bg-accent text-accent-foreground"
                              )}
                            >
                              {subItem.icon}
                              <span>{subItem.label}</span>
                              {subItem.badge}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="ghost"
                      asChild
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium",
                        isActive && "bg-accent text-accent-foreground"
                      )}
                    >
                      <Link to={item.href!}>
                        {item.icon}
                        <span>{item.label}</span>
                        {item.badge}
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* User and Theme Controls */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 ring-1 ring-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user?.name || 'Utilisateur'}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {user?.role?.replace('_', ' ') || 'Utilisateur'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}