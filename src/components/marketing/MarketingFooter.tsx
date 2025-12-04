import { Link } from "react-router-dom";
import { Shield, Mail, Phone, MapPin } from "lucide-react";
const MarketingFooter = () => {
  const productLinks = [{
    name: "Cadet Management",
    href: "/products/cadet-management"
  }, {
    name: "Task Management",
    href: "/products/task-management"
  }, {
    name: "Competition Management",
    href: "/products/competition-management"
  }, {
    name: "Team Management",
    href: "/products/team-management"
  }, {
    name: "Budget Management",
    href: "/products/budget-management"
  }, {
    name: "Inventory Management",
    href: "/products/inventory-management"
  }];
  const companyLinks = [{
    name: "About",
    href: "/about"
  }, {
    name: "Pricing",
    href: "/pricing"
  }, {
    name: "Contact",
    href: "/contact"
  }, {
    name: "Support",
    href: "/contact"
  }];
  return <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">JROTC CCC</span>
            </Link>
            <p className="text-sm text-muted-foreground">The comprehensive platform designed specifically for JROTC program management.</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span><a href="mailto:admin@jortc.us">admin@jortc.us</a></span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Dallas, TX</span>
              </div>
            </div>
          </div>

          {/* Products */}
          

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map(link => <li key={link.name}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="font-semibold mb-4">Get Started</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ready to streamline your JROTC Competitions?
            </p>
            <Link to="/contact" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">© 2025 Carey Unlimited. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms-conditions" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default MarketingFooter;