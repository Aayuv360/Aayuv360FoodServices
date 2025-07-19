import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  RefreshCw,
  Eye,
  Lock,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const PrivacyRefund = () => {
  const [activeTab, setActiveTab] = useState<"privacy" | "refund">("privacy");
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const privacySections = [
    {
      id: "collection",
      title: "Information We Collect",
      icon: <Eye className="h-6 w-6 text-blue-500" />,
      content: `We collect information to provide better services to our users:

Personal Information:
• Name, email address, phone number
• Delivery addresses and preferences
• Payment information (processed securely)
• Dietary preferences and restrictions

Usage Information:
• Order history and preferences
• Website interaction data
• Device and browser information
• Location data for delivery purposes

We only collect information that is necessary to provide our services effectively.`,
    },
    {
      id: "usage",
      title: "How We Use Your Information",
      icon: <Lock className="h-6 w-6 text-green-500" />,
      content: `Your information is used to:

Service Delivery:
• Process and fulfill your orders
• Manage your subscription plans
• Coordinate meal deliveries
• Provide customer support

Communication:
• Send order confirmations and updates
• Notify about delivery schedules
• Share promotional offers (with consent)
• Respond to your inquiries

Service Improvement:
• Analyze usage patterns
• Improve our menu offerings
• Enhance user experience
• Develop new features`,
    },
    {
      id: "sharing",
      title: "Information Sharing",
      icon: <Shield className="h-6 w-6 text-orange-500" />,
      content: `We respect your privacy and limit information sharing:

We DO NOT:
• Sell your personal information to third parties
• Share data for advertising purposes
• Disclose information without consent

We MAY share information with:
• Delivery partners (only delivery-related data)
• Payment processors (secure payment handling)
• Legal authorities (when required by law)
• Service providers (under strict confidentiality agreements)

All third parties are bound by privacy agreements and data protection standards.`,
    },
    {
      id: "security",
      title: "Data Security",
      icon: <Lock className="h-6 w-6 text-red-500" />,
      content: `We implement comprehensive security measures:

Technical Safeguards:
• SSL encryption for data transmission
• Secure servers and databases
• Regular security updates and patches
• Access controls and authentication

Operational Safeguards:
• Employee training on data privacy
• Limited access to personal information
• Regular security audits
• Incident response procedures

While we strive to protect your information, no method of transmission over the internet is 100% secure. We continuously work to improve our security measures.`,
    },
    {
      id: "rights",
      title: "Your Privacy Rights",
      icon: <CheckCircle className="h-6 w-6 text-purple-500" />,
      content: `You have the following rights regarding your personal information:

Access Rights:
• Request copies of your personal data
• Know what information we have about you
• Understand how your data is processed

Control Rights:
• Update or correct your information
• Delete your account and associated data
• Opt-out of marketing communications
• Withdraw consent for data processing

To exercise these rights, contact us at privacy@aayuv.in. We will respond within 30 days of receiving your request.`,
    },
  ];

  const refundSections = [
    {
      id: "policy",
      title: "Refund Policy Overview",
      icon: <RefreshCw className="h-6 w-6 text-blue-500" />,
      content: `Our refund policy is designed to ensure customer satisfaction:

Eligible Refunds:
• Undelivered orders due to our fault
• Significantly delayed deliveries (>2 hours)
• Quality issues reported within 2 hours of delivery
• Cancelled orders before preparation begins
• Subscription cancellations (prorated)

Processing Time:
• Refund requests processed within 24-48 hours
• Amount credited within 5-7 business days
• Refund method same as original payment

Customer satisfaction is our priority, and we work to resolve all issues fairly.`,
    },
    {
      id: "subscription",
      title: "Subscription Refunds",
      icon: <Clock className="h-6 w-6 text-green-500" />,
      content: `Subscription refund terms:

Cancellation Policy:
• Cancel anytime before next billing cycle
• Prorated refunds for unused subscription days
• No cancellation fees or penalties
• Access continues until period ends

Refund Calculation:
• Daily rate = Total subscription cost ÷ subscription days
• Refund = Daily rate × remaining days
• Minimum 24-hour notice required
• Delivery charges may be non-refundable

Example: If you cancel a 30-day subscription after 20 days, you'll receive a refund for the remaining 10 days.`,
    },
    {
      id: "quality",
      title: "Quality & Delivery Issues",
      icon: <AlertCircle className="h-6 w-6 text-orange-500" />,
      content: `We handle quality and delivery issues promptly:

Quality Issues:
• Report within 2 hours of delivery
• Provide photos/description of the issue
• Full refund or replacement offered
• Investigation within 24 hours

Delivery Issues:
• Late deliveries (>2 hours): Partial refund + credit
• Wrong orders: Full refund + correct order
• Missing items: Refund for missing items
• Delivery location issues: Case-by-case review

Our quality assurance team investigates all reported issues to prevent future occurrences.`,
    },
    {
      id: "non-refundable",
      title: "Non-Refundable Situations",
      icon: <CreditCard className="h-6 w-6 text-red-500" />,
      content: `The following situations are generally non-refundable:

Customer-Related:
• Change of mind after order preparation
• Incorrect delivery address provided
• Unavailability at delivery location
• Dietary preferences not communicated

Service-Related:
• Delivery delays due to weather/traffic
• Quality issues reported after 2 hours
• Consumed meals (partial consumption)
• Promotional discounts and credits

We review each case individually and may make exceptions in extraordinary circumstances.`,
    },
    {
      id: "process",
      title: "Refund Request Process",
      icon: <CheckCircle className="h-6 w-6 text-purple-500" />,
      content: `To request a refund:

Step 1: Contact Us
• Email: refunds@aayuv.in
• Phone: +91 98765 43210
• In-app support chat
• Customer service hours: 9 AM - 9 PM

Step 2: Provide Information
• Order number or subscription ID
• Reason for refund request
• Photos (for quality issues)
• Preferred refund method

Step 3: Review Process
• Initial response within 2 hours
• Investigation completed within 24-48 hours
• Refund processed upon approval
• Notification sent when completed

We strive to make the refund process as smooth as possible.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto py-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Privacy & Refund Policy
          </h1>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            Your privacy and satisfaction are our top priorities. Learn about
            how we protect your data and our refund policies.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <Button
              variant={activeTab === "privacy" ? "default" : "ghost"}
              onClick={() => setActiveTab("privacy")}
              className="mr-1"
            >
              <Shield className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
            <Button
              variant={activeTab === "refund" ? "default" : "ghost"}
              onClick={() => setActiveTab("refund")}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refund Policy
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "privacy" && (
            <div className="space-y-6">
              {privacySections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
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
          )}

          {activeTab === "refund" && (
            <div className="space-y-6">
              {refundSections.map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
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
          )}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-1 text-gray-900">
                Need Help or Have Questions?
              </h3>
              <p className="text-gray-600 mb-3">
                Our customer support team is here to help with any privacy or
                refund related questions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold mb-2">Privacy Concerns:</h4>
                  <p>privacy@aayuv.in</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Refund Requests:</h4>
                  <p>refunds@aayuv.in</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">General Support:</h4>
                  <p>support@aayuv.in</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Phone Support:</h4>
                  <p>+91 98765 43210</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyRefund;
