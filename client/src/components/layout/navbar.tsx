import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Search, 
  Briefcase, 
  MessageSquare, 
  Calendar,
  Bell,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isJobSeeker = user?.role === "seeker";
  const isRecruiter = user?.role === "recruiter";

  const jobSeekerNavItems = [
    { label: "Dashboard", href: "/dashboard/job-seeker", icon: User, testId: "nav-dashboard" },
    { label: "Job Search", href: "/dashboard/job-seeker?tab=search", icon: Search, testId: "nav-job-search" },
    { label: "Applications", href: "/dashboard/job-seeker?tab=applications", icon: Briefcase, testId: "nav-applications" },
    { label: "Interviews", href: "/dashboard/job-seeker?tab=interviews", icon: Calendar, testId: "nav-interviews" },
  ];

  const recruiterNavItems = [
    { label: "Dashboard", href: "/dashboard/recruiter", icon: User, testId: "nav-dashboard" },
    { label: "Jobs", href: "/dashboard/recruiter?tab=jobs", icon: Briefcase, testId: "nav-jobs" },
    { label: "Candidates", href: "/dashboard/recruiter?tab=candidates", icon: Search, testId: "nav-candidates" },
    { label: "Applications", href: "/dashboard/recruiter?tab=applications", icon: MessageSquare, testId: "nav-applications" },
    { label: "Interviews", href: "/dashboard/recruiter?tab=interviews", icon: Calendar, testId: "nav-interviews" },
  ];

  const getNavItems = () => {
    if (isJobSeeker) return jobSeekerNavItems;
    if (isRecruiter) return recruiterNavItems;
    return [];
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  if (!user) {
    // Public navbar for unauthenticated users
    return (
      <nav className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex items-center cursor-pointer" data-testid="logo">
                <h1 className="text-2xl font-bold text-primary">AI Talent Match</h1>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" data-testid="nav-sign-in">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button data-testid="nav-get-started">Get Started</Button>
              </Link>
            </div>

            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="mobile-menu-trigger">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    <Link href="/login">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated navbar
  return (
    <nav className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={isJobSeeker ? "/dashboard/job-seeker" : "/dashboard/recruiter"}>
            <div className="flex items-center cursor-pointer" data-testid="logo">
              <h1 className="text-2xl font-bold text-primary">AI Talent Match</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {getNavItems().map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                (item.href.includes("?tab=") && location.includes(item.href.split("?")[0]));
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="flex items-center space-x-2"
                    data-testid={item.testId}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative" data-testid="notifications-button">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                3
              </Badge>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {getUserInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium" data-testid="user-name">
                      {user.full_name}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium" data-testid="dropdown-user-name">{user.full_name}</p>
                  <p className="text-xs text-gray-500" data-testid="dropdown-user-email">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="dropdown-profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="dropdown-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="dropdown-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="mobile-menu-trigger">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col space-y-4 mt-6">
                    {/* User info */}
                    <div className="flex items-center space-x-3 pb-4 border-b">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white">
                          {getUserInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid="mobile-user-name">{user.full_name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>

                    {/* Navigation items */}
                    {getNavItems().map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setMobileMenuOpen(false)}
                            data-testid={`mobile-${item.testId}`}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Button>
                        </Link>
                      );
                    })}

                    <div className="pt-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600"
                        onClick={handleLogout}
                        data-testid="mobile-logout"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
