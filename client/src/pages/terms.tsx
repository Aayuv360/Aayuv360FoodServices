import { getCurrentISTDate } from "@/lib/timezone-utils";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Clock, AlertTriangle } from "lucide-react";

const Terms = () => {
  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      icon: <Shield className="h-6 w-6 text-orange-500" />,
      content: `By accessing and using Aayuv's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
    },
    {
      id: "services",
      title: "2. Description of Services",
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      content: `Aayuv provides meal delivery services specializing in millet-based cuisine. Our services include:
      • Subscription-based meal plans
      • One-time meal orders
      • Customized dietary options
      • Delivery scheduling and management
      
      We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.`,
    },
    {
      id: "user-obligations",
      title: "3. User Obligations",
      icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
      content: `As a user of our services, you agree to:
      • Provide accurate and complete information during registration
      • Maintain the security of your account credentials
      • Use our services only for lawful purposes
      • Respect intellectual property rights
      • Not interfere with the proper functioning of our platform
      • Comply with all applicable local, state, and federal laws`,
    },
    {
      id: "subscription",
      title: "4. Subscription Terms",
      icon: <Clock className="h-6 w-6 text-green-500" />,
      content: `Subscription services are subject to the following terms:
      • Subscriptions automatically renew unless cancelled
      • Cancellation must be made at least 24 hours before the next billing cycle
      • Refunds are processed according to our refund policy
      • Subscription modifications may affect pricing
      • We reserve the right to change subscription prices with 30 days notice`,
    },
    {
      id: "delivery",
      title: "5. Delivery Terms",
      icon: <FileText className="h-6 w-6 text-purple-500" />,
      content: `Delivery services are provided subject to:
      • Service availability in your area
      • Weather conditions and unforeseen circumstances
      • Accurate delivery address and contact information
      • Someone being available to receive the delivery
      • Delivery time windows are estimates and may vary
      • Failed deliveries due to incorrect information may incur additional charges`,
    },
    {
      id: "payment",
      title: "6. Payment Terms",
      icon: <Shield className="h-6 w-6 text-red-500" />,
      content: `Payment terms include:
      • All prices are in Indian Rupees (INR)
      • Payment is required before delivery
      • We accept various payment methods as displayed on our platform
      • Failed payments may result in service suspension
      • Disputes must be reported within 7 days of the transaction
      • Unauthorized use of payment methods is prohibited`,
    },
    {
      id: "privacy",
      title: "7. Privacy and Data Protection",
      icon: <Shield className="h-6 w-6 text-indigo-500" />,
      content: `We are committed to protecting your privacy:
      • Personal information is collected and used as described in our Privacy Policy
      • We implement appropriate security measures
      • Data is not sold to third parties for marketing purposes
      • You have the right to access and correct your personal information
      • Data retention follows applicable legal requirements`,
    },
    {
      id: "limitation",
      title: "8. Limitation of Liability",
      icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
      content: `Aayuv's liability is limited as follows:
      • We are not liable for indirect, incidental, or consequential damages
      • Total liability shall not exceed the amount paid for services
      • We are not responsible for delays due to circumstances beyond our control
      • Food allergies and dietary restrictions are the customer's responsibility to communicate
      • We make no warranties regarding uninterrupted service availability`,
    },
    {
      id: "termination",
      title: "9. Termination",
      icon: <FileText className="h-6 w-6 text-gray-500" />,
      content: `Either party may terminate the agreement:
      • Users can cancel their account at any time
      • We may suspend or terminate accounts for violations of these terms
      • Upon termination, all rights and obligations cease except those that survive termination
      • Refunds will be processed according to our refund policy`,
    },
    {
      id: "changes",
      title: "10. Changes to Terms",
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      content: `We reserve the right to modify these terms:
      • Changes will be posted on our website
      • Users will be notified of significant changes
      • Continued use of services constitutes acceptance of modified terms
      • If you disagree with changes, you may terminate your account`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-blue-600">
            Terms of Service
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            Please read these terms and conditions carefully before using
            Aayuv's services. These terms govern your use of our platform and
            services.
          </p>
          <div className="mt-3 text-sm text-gray-500">
            Last updated: {getCurrentISTDate().toLocaleDateString()}
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-gray-900">
                    {section.icon}
                    <span className="ml-3">{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                Questions About Our Terms?
              </h3>
              <p className="text-gray-600 mb-2">
                If you have any questions about these Terms of Service, please
                contact us.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Email: support@aayuv.in</p>
                <p>Phone: +91 98765 43210</p>
                <p>Address: Hyderabad, Telangana, India</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
