import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, LayoutDashboard, Briefcase, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, profile, signOut, isAdmin, isFreelancer } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (profile?.display_name) return profile.display_name.substring(0, 2).toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return "U";
  };

  const navLinks = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/messaging", label: "Messages", auth: true },
  ];

  const mobileNavLinks = [
    ...navLinks,
    { href: "/profile", label: "Profile", auth: true },
    { href: "/freelancer/posts", label: "My Posts", auth: true, freelancer: true },
    { href: "/admin", label: "Admin", auth: true, admin: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img src="https://i.ibb.co/yWc8nK7/creators-market-icon.png" alt="Creators Market Logo" className="h-8 w-8" />
            <span className="font-bold sm:inline-block">
              Creators Market
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              (!link.auth || user) && (
                <Link
                  key={link.href}
                  to={link.href}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.display_name || ""} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.display_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                {isFreelancer && (
                  <DropdownMenuItem onClick={() => navigate('/freelancer/posts')}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>My Posts</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/messaging')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
                  <img src="https://i.ibb.co/yWc8nK7/creators-market-icon.png" alt="Creators Market Logo" className="h-8 w-8" />
                  <span className="ml-2 font-bold">Creators Market</span>
                </Link>
              </SheetHeader>
              <div className="mt-4 flex flex-col space-y-2">
                {mobileNavLinks.map((link) => {
                  const showLink = !link.auth || user;
                  const showAdminLink = !link.admin || isAdmin;
                  const showFreelancerLink = !link.freelancer || isFreelancer;
                  
                  if (showLink && showAdminLink && showFreelancerLink) {
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  return null;
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}