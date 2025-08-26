
import { Home, DollarSign, Receipt, Calculator, Settings, Stethoscope, LogOut, User, Car, ChevronDown, UserCog, Zap, FileText } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUncategorizedCount } from "@/hooks/useUncategorizedCount";
import { useUncategorizedIncomeCount } from "@/hooks/useUncategorizedIncomeCount";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Income",
    url: "/income",
    icon: DollarSign,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Receipt,
    subItems: [
      {
        title: "Vehicle",
        url: "/vehicle",
        icon: Car,
      },
    ],
  },
  {
    title: "Tax Estimator",
    url: "/tax-estimator",
    icon: Calculator,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    subItems: [
      {
        title: "Profile Settings",
        url: "/settings#profile",
        icon: UserCog,
      },
      {
        title: "Tax Settings",
        url: "/settings#tax-settings", 
        icon: FileText,
      },
      {
        title: "Automations",
        url: "/settings#automations",
        icon: Zap,
      },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { data: uncategorizedCount, isLoading: isLoadingCount } = useUncategorizedCount();
  const { data: uncategorizedIncomeCount, isLoading: isLoadingIncomeCount } = useUncategorizedIncomeCount();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand items that contain the current route
  useEffect(() => {
    const currentPath = location.pathname + location.hash;
    const itemsToExpand = menuItems
      .filter(item => 
        item.subItems && 
        (item.subItems.some(sub => sub.url === currentPath) || item.url === location.pathname)
      )
      .map(item => item.title);
    
    if (itemsToExpand.length > 0) {
      setExpandedItems(prev => [...new Set([...prev, ...itemsToExpand])]);
    }
  }, [location.pathname, location.hash]);

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isExpanded = (title: string) => expandedItems.includes(title);

  const displayName = profile?.name || user?.email || 'User';
  const initials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || 'U';

  // Helper function to render title with optional badge
  const renderTitleWithBadge = (title: string) => {
    // Handle Expenses badge
    if (title === "Expenses" && uncategorizedCount && uncategorizedCount > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span>{title}</span>
                <Badge 
                  variant="secondary" 
                  className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 h-5 min-w-[20px] justify-center"
                >
                  {uncategorizedCount}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Uncategorized transactions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // Handle Income badge
    if (title === "Income" && uncategorizedIncomeCount && uncategorizedIncomeCount > 0) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span>{title}</span>
                <Badge 
                  variant="secondary" 
                  className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 h-5 min-w-[20px] justify-center"
                >
                  {uncategorizedIncomeCount}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Uncategorized income transactions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return <span>{title}</span>;
  };

  return (
    <Sidebar className="border-r border-blue-100 bg-sidebar">
      <SidebarHeader className="border-b border-blue-100 p-6">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/16e440ef-c429-4e1a-be88-06b50fbc8743.png" 
            alt="HelixMD Financial"
            className="max-w-full h-auto"
            style={{ maxHeight: '40px' }}
          />
        </div>
        <SidebarTrigger className="mt-4" />
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.subItems ? (
                <Collapsible open={isExpanded(item.title)} onOpenChange={() => toggleExpanded(item.title)}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <div className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors cursor-pointer",
                        location.pathname === item.url || 
                        item.subItems.some(sub => location.pathname + location.hash === sub.url) ||
                        item.subItems.some(sub => location.pathname === sub.url)
                          ? "bg-blue-100 text-blue-900 font-medium"
                          : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                      )}>
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {renderTitleWithBadge(item.title)}
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded(item.title) ? "rotate-180" : ""
                        )} />
                      </div>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-6 mt-1 space-y-1">
                    {/* Only show "All {item.title}" for non-Settings items */}
                    {item.title !== "Settings" && (
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            location.pathname === item.url
                              ? "bg-blue-100 text-blue-900 font-medium"
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>All {item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                    {item.subItems.map((subItem) => (
                      <SidebarMenuButton key={subItem.title} asChild>
                        <Link
                          to={subItem.url}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            location.pathname + location.hash === subItem.url
                              ? "bg-blue-100 text-blue-900 font-medium"
                              : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                          )}
                        >
                          <subItem.icon className="h-4 w-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton asChild>
                  <Link
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      location.pathname === item.url
                        ? "bg-blue-100 text-blue-900 font-medium"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-800"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {renderTitleWithBadge(item.title)}
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 text-blue-900 text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignOut}
          className="w-full justify-start gap-2 text-gray-700 hover:text-red-600 hover:border-red-200"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
