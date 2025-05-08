import { Link } from "wouter";
import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-neutral-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold">
                A
              </div>
              <h2 className="text-2xl font-bold text-white">Aayuv</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Bringing traditional millet-based cuisine to modern tables with
              convenience and nutrition.
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <Facebook />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <Instagram />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
              >
                <Twitter />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-accent font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/menu" className="text-gray-400 hover:text-white transition duration-200">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/subscription" className="text-gray-400 hover:text-white transition duration-200">
                  Plans & Pricing
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h3 className="text-lg font-accent font-semibold mb-4">
              Help & Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  Delivery Information
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition duration-200">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="text-lg font-accent font-semibold mb-4">
              Contact Us
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-400">
                  123 Food Street, Hyderabad, Telangana, India
                </span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-400">support@Aayuv.com</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-400">+91 9876543210</span>
              </li>
            </ul>

            <h3 className="text-lg font-accent font-semibold mt-6 mb-4">
              Subscribe to Our Newsletter
            </h3>
            <form className="flex">
              <Input
                type="email"
                placeholder="Your email address"
                className="rounded-r-none text-neutral-dark"
              />
              <Button
                type="submit"
                className="rounded-l-none bg-primary hover:bg-primary/90"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Aayuv. All rights reserved.
            Handcrafted with love in Hyderabad, India.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
