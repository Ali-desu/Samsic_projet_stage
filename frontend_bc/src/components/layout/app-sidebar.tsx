import { Calendar, Home, Inbox, Search, Settings, User } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Define types for menu items and user
interface MenuItem {
  title: string
  url: string
  icon: React.ComponentType<any>
  role?: string
}

interface User {
  name: string
  email: string
  avatar?: string
}

// Mock user data (replace with actual auth context or API data)
const user: User = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://github.com/shadcn.png", // Placeholder avatar
}

// Role-based menu items
const menuItems: MenuItem[] = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "/back-office/inbox",
    icon: Inbox,
    role: "back-office",
  },
  {
    title: "Bons de Commandes",
    url: "/back-office/bons-de-commandes",
    icon: Calendar,
    role: "back-office",
  },
  {
    title: "Suivi",
    url: "/back-office/prestations",
    icon: Search,
    role: "back-office",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar({ role = "back-office" }: { role?: string }) {
  // Filter menu items based on role
  const filteredItems = menuItems.filter(
    (item) => !item.role || item.role === role
  )

  return (
    <Sidebar className="bg-gray-900 border-gray-700">
      <SidebarContent className="bg-gray-900">
        {/* Logo/Brand Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">BC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">BackOffice</h1>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          </div>
        </div>

        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="group relative overflow-hidden rounded-lg transition-all duration-200 hover:bg-gray-800 hover:shadow-lg"
                  >
                    <a href={item.url} className="flex items-center gap-3 px-4 py-3">
                      {/* Icon container with gradient background on hover */}
                      <div className="relative">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-blue-500 transition-all duration-200">
                          <item.icon size={18} className="text-gray-300 group-hover:text-white transition-colors duration-200" />
                        </div>
                      </div>
                      
                      <span className="text-gray-300 group-hover:text-white font-medium transition-colors duration-200">
                        {item.title}
                      </span>
                      
                      {/* Hover effect line */}
                      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center"></div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-gray-700 bg-gray-900">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 group">
              <Avatar className="h-10 w-10 ring-2 ring-gray-700 group-hover:ring-purple-500 transition-all duration-200">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors duration-200">
                  {user.name}
                </span>
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                  {user.email}
                </span>
              </div>
              
              {/* Status indicator */}
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Additional footer info */}
        <div className="mt-3 px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Version 1.0.0</span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}