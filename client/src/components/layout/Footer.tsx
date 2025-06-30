import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PhoneCall,
  Mail,
  MapPin,
  Home,
  Info,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Send,
  ShieldCheck,
  HelpCircle,
  Building2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

const Footer = () => {
  const navigate = useNavigate();
  const [newsLetterEmail, setNewsLetterEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const newsLetterSubmit = async () => {
    if (!newsLetterEmail.trim()) {
      setEmailError("Email is required.");
      return;
    }

    if (!validateEmail(newsLetterEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setEmailError("");
      await apiRequest("POST", "/api/newsletter", {
        email: newsLetterEmail,
      });
      setNewsLetterEmail("");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || "Something went wrong. Please try again.";

      setEmailError(errorMessage);
    }
  };

  return (
    <footer className="bg-gray-50 p-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 text-sm text-gray-600">
          <div>
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold">
                A
              </div>
              <span className="ml-2 text-xl font-bold text-orange-600">
                Aayuv
              </span>
            </div>
            <p className="mb-4 leading-relaxed">
              Bringing traditional millet-based cuisine to modern tables with
              convenience and nutrition.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="hover:text-orange-500"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="hover:text-orange-500"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="hover:text-orange-500"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="hover:text-orange-500"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <div className="flex items-center text-sm font-medium text-gray-800 mb-4">
              <Home size={16} className="mr-2 text-orange-500" />
              Quick Links
            </div>
            <ul className="space-y-3">
              {[
                {
                  label: "About Us",
                  icon: <Users size={16} />,
                  path: "/about-us",
                },
                {
                  label: "Terms",
                  icon: <ShieldCheck size={16} />,
                  path: "/terms",
                },
                {
                  label: "Privacy & Refund",
                  icon: <ShieldCheck size={16} />,
                  path: "/privacy-refund",
                },
                {
                  label: "FAQs",
                  icon: <HelpCircle size={16} />,
                  path: "/faqs",
                },
              ].map(({ label, icon, path }, index) => (
                <li key={index}>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto flex items-center text-gray-600 hover:text-orange-500"
                    onClick={() => navigate(path)}
                  >
                    <span className="mr-2 text-orange-500">{icon}</span>
                    {label}
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center text-sm font-medium text-gray-800 mb-4">
              <MapPin size={16} className="mr-2 text-orange-500" />
              Contact
            </div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <PhoneCall size={16} className="text-orange-500 mt-0.5" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start space-x-2">
                <Mail size={16} className="text-orange-500 mt-0.5" />
                <span>support@aayuv.in</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin size={16} className="text-orange-500 mt-0.5" />
                <span>Hyd</span>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center text-sm font-medium text-gray-800 mb-4">
              <Send size={16} className="mr-2 text-orange-500" />
              Newsletter
            </div>
            <p className="mb-3">
              Subscribe to get our latest updates and healthy tips.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className={`w-full px-3 py-2 border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } rounded text-sm`}
                value={newsLetterEmail}
                onChange={(e) => {
                  setNewsLetterEmail(e.target.value);
                  if (e.target.value.trim() === "") {
                    setEmailError("");
                  }
                }}
              />
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm"
                onClick={newsLetterSubmit}
              >
                Subscribe
              </Button>
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-10">
          © {new Date().getFullYear()} Aayuv. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
