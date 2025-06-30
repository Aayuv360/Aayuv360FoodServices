
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Truck, 
  CreditCard, 
  Utensils, 
  Clock, 
  Shield,
  HelpCircle,
  Phone,
  Mail
} from "lucide-react";

const FAQs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { id: "all", name: "All", icon: <HelpCircle className="h-4 w-4" />, color: "bg-gray-500" },
    { id: "orders", name: "Orders", icon: <Utensils className="h-4 w-4" />, color: "bg-orange-500" },
    { id: "delivery", name: "Delivery", icon: <Truck className="h-4 w-4" />, color: "bg-blue-500" },
    { id: "subscription", name: "Subscription", icon: <Clock className="h-4 w-4" />, color: "bg-green-500" },
    { id: "payment", name: "Payment", icon: <CreditCard className="h-4 w-4" />, color: "bg-purple-500" },
    { id: "account", name: "Account", icon: <Shield className="h-4 w-4" />, color: "bg-red-500" },
  ];

  const faqs = [
    {
      id: "what-is-aayuv",
      category: "orders",
      question: "What is Aayuv and what makes you different?",
      answer: "Aayuv is a meal delivery service specializing in traditional millet-based cuisine. We're different because we focus exclusively on nutritious millet meals that are gluten-free, high in fiber, and rich in essential minerals. Our meals combine ancient wisdom with modern convenience, offering 38 unique recipes that cater to health-conscious individuals seeking authentic, nutritious food."
    },
    {
      id: "service-areas",
      category: "delivery",
      question: "Which areas do you deliver to?",
      answer: "Currently, we deliver to major areas in Hyderabad including Gachibowli, Madhapur, Kondapur, Kukatpally, and Miyapur. We're actively expanding to Bangalore and Chennai. You can check if we deliver to your area by entering your location on our website or app."
    },
    {
      id: "subscription-plans",
      category: "subscription",
      question: "What subscription plans do you offer?",
      answer: "We offer three main subscription plans: Basic (1 meal/day), Premium (2 meals/day), and Family (3+ meals/day). Each plan can be customized for 7, 15, or 30-day periods. You can choose from our curated meal selections or create custom meal plans based on your dietary preferences."
    },
    {
      id: "meal-customization",
      category: "orders",
      question: "Can I customize my meals?",
      answer: "Absolutely! You can customize meals based on your dietary preferences (vegetarian, vegan, high-protein, etc.), spice levels, and ingredient restrictions. Our menu rotates with 30+ millet-based options, and you can select different curry options for most meals. Simply specify your preferences during ordering or in your subscription settings."
    },
    {
      id: "delivery-timing",
      category: "delivery",
      question: "What are your delivery timings?",
      answer: "We deliver meals during three time slots: Breakfast (7-10 AM), Lunch (11 AM-2 PM), and Dinner (6-9 PM). You can schedule deliveries up to 7 days in advance. For subscriptions, you can set recurring delivery preferences. We send notifications 30 minutes before delivery."
    },
    {
      id: "payment-methods",
      category: "payment",
      question: "What payment methods do you accept?",
      answer: "We accept all major payment methods including credit/debit cards, UPI payments, net banking, and digital wallets like Paytm, Google Pay, and PhonePe. For subscriptions, we securely store your payment method for automatic renewals. All transactions are processed through Razorpay for maximum security."
    },
    {
      id: "cancel-subscription",
      category: "subscription",
      question: "How can I cancel my subscription?",
      answer: "You can cancel your subscription anytime from your account dashboard or by contacting customer support. Cancellations made at least 24 hours before your next billing cycle will receive a prorated refund for unused days. There are no cancellation fees, and you'll continue to receive meals until your current period ends."
    },
    {
      id: "food-allergies",
      category: "orders",
      question: "How do you handle food allergies and dietary restrictions?",
      answer: "We take food allergies very seriously. During signup, you can specify all allergies and dietary restrictions. Our meals are clearly labeled with ingredients and allergen information. We have dedicated preparation areas for common allergens and follow strict protocols to prevent cross-contamination. Always inform us of any allergies when ordering."
    },
    {
      id: "meal-storage",
      category: "orders",
      question: "How should I store the meals and how long do they last?",
      answer: "Our meals are delivered fresh and should be consumed within 24 hours for best taste and quality. If you need to store them longer, refrigerate immediately and consume within 2-3 days. Always reheat thoroughly before consuming. We don't recommend freezing as it may affect the texture and taste of millet-based dishes."
    },
    {
      id: "delivery-issues",
      category: "delivery",
      question: "What if I miss my delivery or there's an issue?",
      answer: "If you miss a delivery, our delivery partner will attempt to contact you and wait for 10 minutes. You can reschedule the delivery through our app or customer support. For delivery issues like late arrival or incorrect orders, contact us immediately. We offer replacements, refunds, or credit based on the situation."
    },
    {
      id: "nutritional-info",
      category: "orders",
      question: "Do you provide nutritional information for meals?",
      answer: "Yes! Each meal comes with detailed nutritional information including calories, protein, carbohydrates, fiber, and key vitamins/minerals. Our millet-based meals are naturally rich in iron, magnesium, and B-vitamins. You can view nutritional details on our menu, and our app tracks your daily nutritional intake."
    },
    {
      id: "bulk-orders",
      category: "orders",
      question: "Do you cater to bulk orders or corporate events?",
      answer: "Yes, we offer bulk ordering for corporate events, parties, and group orders. For orders above 20 meals, we provide special pricing and can customize menus based on your requirements. Contact our corporate team at corporate@aayuv.in or call +91 98765 43210 for bulk order arrangements."
    },
    {
      id: "account-management",
      category: "account",
      question: "How do I manage my account and update preferences?",
      answer: "You can manage your account through our website or mobile app. Update your delivery addresses, payment methods, dietary preferences, and subscription settings anytime. Your account dashboard shows order history, upcoming deliveries, and nutritional tracking. You can also pause subscriptions temporarily if needed."
    },
    {
      id: "quality-assurance",
      category: "orders",
      question: "How do you ensure food quality and safety?",
      answer: "We maintain the highest food safety standards with FSSAI certification and regular kitchen audits. Our ingredients are sourced from certified suppliers, and meals are prepared in hygienic conditions daily. We follow HACCP protocols, maintain cold chain during delivery, and conduct regular quality checks. All our preparation staff are trained in food safety."
    },
    {
      id: "customer-support",
      category: "account",
      question: "How can I contact customer support?",
      answer: "Our customer support is available 9 AM - 9 PM daily. You can reach us through: In-app chat, Email: support@aayuv.in, Phone: +91 98765 43210, or WhatsApp. For urgent delivery issues, we have 24/7 support. We typically respond to emails within 2 hours and phone calls are answered immediately during business hours."
    },
    {
      id: "referral-program",
      category: "account",
      question: "Do you have a referral or loyalty program?",
      answer: "Yes! Our referral program gives you ₹100 credit for each friend who places their first order using your referral code. Your friend also gets ₹50 off their first order. We also have a loyalty program where you earn points for every order that can be redeemed for discounts. Long-term subscribers get exclusive benefits and early access to new menu items."
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions about Aayuv's millet-based meal delivery service. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <div className="max-w-4xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-2 justify-center mb-8"
          >
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center"
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {category.id === "all" 
                    ? faqs.length 
                    : faqs.filter(faq => faq.category === category.id).length
                  }
                </Badge>
              </Button>
            ))}
          </motion.div>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-12"
            >
              <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No FAQs found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search terms or browse different categories.
              </p>
            </motion.div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <Button
                      variant="ghost"
                      className="w-full p-6 justify-between text-left h-auto"
                      onClick={() => toggleFAQ(faq.id)}
                    >
                      <div className="flex items-start">
                        <Badge
                          variant="secondary"
                          className={`mr-3 mt-1 ${
                            categories.find(cat => cat.id === faq.category)?.color || "bg-gray-500"
                          } text-white`}
                        >
                          {categories.find(cat => cat.id === faq.category)?.icon}
                        </Badge>
                        <span className="text-lg font-semibold text-gray-900">
                          {faq.question}
                        </span>
                      </div>
                      {expandedFAQ === faq.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      )}
                    </Button>
                    {expandedFAQ === faq.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-6"
                      >
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Contact Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-8">
              <MessageSquare className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Still Have Questions?
              </h3>
              <p className="text-gray-600 mb-6">
                Our friendly customer support team is here to help you with any questions 
                not covered in our FAQ.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                  <Mail className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-sm font-medium">support@aayuv.in</span>
                </div>
                <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                  <Phone className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-sm font-medium">+91 98765 43210</span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Support Hours: 9:00 AM - 9:00 PM (7 days a week)
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQs;
