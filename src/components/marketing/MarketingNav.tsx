import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
const MarketingNav = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const products = [{
    name: "Cadet Management",
    href: "/products/cadet-management",
    description: "Track progress and profiles"
  }, {
    name: "Task Management",
    href: "/products/task-management",
    description: "Assign and monitor tasks"
  }, {
    name: "Competition Management",
    href: "/products/competition-management",
    description: "Event planning and scoring"
  }, {
    name: "Team Management",
    href: "/products/team-management",
    description: "Organize units and leadership"
  }, {
    name: "Budget Management",
    href: "/products/budget-management",
    description: "Financial tracking"
  }, {
    name: "Inventory Management",
    href: "/products/inventory-management",
    description: "Equipment and maintenance"
  }, {
    name: "Calendar Management",
    href: "/products/calendar-management",
    description: "Schedule events and deadlines"
  }, {
    name: "Email Management",
    href: "/products/email-management",
    description: "Automated communications"
  }];
  return <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">JROTC Command & Control Center
          </span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>         

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/about" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    About
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/pricing" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Pricing
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>             
             
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/contact" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                    Contact
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button asChild>
              <Link to="/app/auth">Sign In</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="md:hidden pb-4">
            <div className="space-y-2">
              <Link to="/pricing" className="block px-4 py-2 text-sm hover:bg-accent rounded-md" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>
              <Link to="/about" className="block px-4 py-2 text-sm hover:bg-accent rounded-md" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link to="/contact" className="block px-4 py-2 text-sm hover:bg-accent rounded-md" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              <div className="pt-2 border-t">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full justify-start">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>}
      </div>
    </nav>;
};
export default MarketingNav;