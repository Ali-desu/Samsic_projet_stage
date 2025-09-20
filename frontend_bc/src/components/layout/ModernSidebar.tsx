import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Inbox, 
  FileText, 
  Building2, 
  LogOut, 
  ChevronLeft, 
  TrendingUp, 
  Database, 
  ChevronDown 
} from "lucide-react";
import { useAuth } from "@/features/auth/authContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from '@/components/themeToggle';
import { useQuery } from '@tanstack/react-query';
import { getUserIdByEmail, getUnreadNotificationsByUserId } from '@/features/auth/api';
import { useState, useEffect } from "react";

export type SidebarMenuItem = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  roles?: string[];
  badge?: React.ReactNode;
  subItems?: SidebarMenuItem[];
};

const defaultMenu: SidebarMenuItem[] = [
  { 
    label: 'Tableau de Bord', 
    icon: <Home className="h-4 w-4" />, 
    href: '/app/dashboard' 
  },
  { 
    label: 'Boîte de Réception', 
    icon: <Inbox className="h-4 w-4" />, 
    href: '/app/inbox', 
    badge: <span className="ml-auto bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">0</span> 
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

export function ModernSidebar({ menu = defaultMenu }: { menu?: SidebarMenuItem[] }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

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

  // Toggle sidebar with '[' key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.key === '[' &&
        (!target || !target.tagName.match(/INPUT|TEXTAREA|SELECT/))
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar]);

  const filteredMenu = menu
    .filter(item => !item.roles || (user && item.roles.includes(user.role)))
    .map(item => {
      if (item.label === 'Boîte de Réception') {
        return {
          ...item,
          badge: unreadNotifications.length > 0 ? (
            <span className="ml-auto bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs font-medium">
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

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus((prev: string[]) => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  return (
    <Sidebar 
      className={cn(
        "bg-sidebar text-sidebar-foreground fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out z-40",
        state === "collapsed" ? "w-16" : "w-60"
      )}
      data-state={state}
      aria-expanded={state === "expanded"}
      role="region"
      aria-label="Navigation principale"
    >
      <SidebarHeader className="p-4 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">BC</span>
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col">
              <h2 className="font-semibold text-sm tracking-tight">Samsic</h2>
              <p className="text-xs text-muted-foreground">Système de Gestion</p>
            </div>
          )}
        </div>
        <SidebarTrigger 
          className="text-sidebar-foreground hover:text-sidebar-primary transition-colors duration-200"
          aria-label={state === "collapsed" ? "Ouvrir la barre latérale" : "Fermer la barre latérale"}
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform duration-200", state === "collapsed" && "rotate-180")} />
        </SidebarTrigger>
      </SidebarHeader>

      <SidebarContent className="py-4 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel 
            className={cn(
              "px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground",
              state === "collapsed" && "hidden"
            )}
          >
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenu.map(item => {
                const isActive = item.href ? location.pathname.startsWith(item.href) : false;
                const isSubMenuOpen = openSubMenus.includes(item.label);
                return (
                  <SidebarMenuItem key={item.label}>
                    {item.subItems ? (
                      <>
                        <SidebarMenuButton
                          className={cn(
                            "sidebar-menu-button flex items-center gap-2 px-3 py-2 text-sm",
                            isActive && "active",
                            state === "collapsed" && "justify-center px-2"
                          )}
                          onClick={() => toggleSubMenu(item.label)}
                          aria-label={item.label}
                        >
                          {item.icon}
                          {state !== "collapsed" && (
                            <>
                              <span className="truncate flex-1 text-left">{item.label}</span>
                              <ChevronDown className={cn(
                                "ml-auto h-4 w-4 transition-transform duration-200",
                                isSubMenuOpen && "rotate-180"
                              )} />
                            </>
                          )}
                          {state === "collapsed" && (
                            <div className="absolute left-full ml-2 hidden group-hover:block bg-sidebar text-sidebar-foreground text-xs px-2 py-1 rounded shadow-md z-50">
                              {item.label}
                            </div>
                          )}
                        </SidebarMenuButton>
                        {isSubMenuOpen && state !== "collapsed" && (
                          <SidebarMenu className="pl-4">
                            {item.subItems.map(subItem => {
                              const isSubActive = location.pathname.startsWith(subItem.href!);
                              return (
                                <SidebarMenuItem key={subItem.label}>
                                  <SidebarMenuButton
                                    asChild
                                    isActive={isSubActive}
                                    className={cn(
                                      "sidebar-menu-button flex items-center gap-2 px-3 py-2 text-sm",
                                      isSubActive && "active"
                                    )}
                                  >
                                    <Link to={subItem.href!} className="flex items-center gap-2 w-full">
                                      {subItem.icon}
                                      <span className="truncate">{subItem.label}</span>
                                      {subItem.badge}
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              );
                            })}
                          </SidebarMenu>
                        )}
                      </>
                    ) : (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "sidebar-menu-button flex items-center gap-2 px-3 py-2 text-sm",
                          isActive && "active",
                          state === "collapsed" && "justify-center px-2"
                        )}
                      >
                        <Link to={item.href!} className="flex items-center gap-2 w-full">
                          {item.icon}
                          {state !== "collapsed" && (
                            <span className="truncate flex-1 text-left">{item.label}</span>
                          )}
                          {state !== "collapsed" && item.badge}
                          {state === "collapsed" && (
                            <div className="absolute left-full ml-2 hidden group-hover:block bg-sidebar text-sidebar-foreground text-xs px-2 py-1 rounded shadow-md z-50">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn(
        "p-4 border-t border-sidebar-border",
        state === "collapsed" && "p-2 flex flex-col items-center gap-2"
      )}>
        <div className={cn(
          "flex items-center gap-2 mb-3",
          state === "collapsed" && "flex-col gap-1"
        )}>
          <Avatar className="h-8 w-8 ring-1 ring-sidebar-border">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {state !== "collapsed" && (
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user?.role?.replace('_', ' ') || 'Utilisateur'}
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-center mb-3">
          <ThemeToggle />
        </div>
        <Button
          variant={state === "collapsed" ? "ghost" : "outline"}
          size={state === "collapsed" ? "icon" : "sm"}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            state === "collapsed" && "w-10 h-10"
          )}
          onClick={logout}
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {state !== "collapsed" && "Déconnexion"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}