import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Heart,
  Leaf,
  Mail,
  Phone,
  Send,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMeals } from "@/hooks/use-meals";
import { useKitchens, useReviews } from "@/hooks/use-commonServices";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";

export interface Kitchen {
  id: number;
  area: string;
  pincode: string;
  deliveryFee: number;
  lnt: number;
  lng: number;
  serviceRadius: number;
  status: string;
}
const AboutUs = () => {
  const { toast } = useToast();
  const { data: meals } = useMeals();
  const { data: kitchens = [] } = useKitchens();
  const { data: reviews } = useReviews();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    rating: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Thank you for your feedback!",
          description:
            "We appreciate your review and will get back to you soon.",
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          rating: 5,
        });
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <PageBreadcrumb />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center text-2xl font-bold mr-4">
                A
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
                Aayuv
              </h2>
            </div>
            <p className="text-lg md:text-xl text-gray-700 mb-1">
              Nourishing Lives with Traditional Millet-Based Cuisine
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              We're on a mission to bring the ancient wisdom of millet nutrition
              to modern tables, making healthy eating convenient, delicious, and
              accessible for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-5 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded with a passion for nutrition and sustainability, Aayuv
                  was born from the recognition that modern diets often lack the
                  essential nutrients our ancestors enjoyed through millet-based
                  foods.
                </p>
                <p>
                  Our journey began when we realized that despite the proven
                  health benefits of millets - being gluten-free, rich in fiber,
                  and packed with essential minerals - they were disappearing
                  from our daily meals due to busy lifestyles.
                </p>
                <p>
                  Today, we're proud to serve thousands of health-conscious
                  individuals who trust us to deliver nutritious, delicious
                  meals that honor traditional recipes while fitting seamlessly
                  into modern life.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <Card className="p-3 text-center">
                <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {reviews?.length}+
                </h3>
                <p className="text-gray-600">Happy Customers</p>
              </Card>
              <Card className="p-3 text-center">
                <Leaf className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {meals?.length}
                </h3>
                <p className="text-gray-600">Millet Recipes</p>
              </Card>
              <Card className="p-3 text-center">
                <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {kitchens?.length
                    ? `${kitchens.length}${kitchens.length > 1 ? "+" : ""}`
                    : "0"}
                </h3>
                <p className="text-gray-600">
                  {kitchens?.length === 1 ? "Service Area" : "Service Areas"}
                </p>
              </Card>

              <Card className="p-3 text-center">
                <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">100%</h3>
                <p className="text-gray-600">Natural Ingredients</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Locations Section */}
      <section className="py-5 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Our Service Locations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're expanding across major cities to bring healthy millet meals
              to your doorstep
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kitchens?.map((location, index) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Hyderabad
                      </CardTitle>
                      <Badge
                        variant={
                          location?.status === "Active"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          location?.status === "Active" ? "bg-green-500" : ""
                        }
                      >
                        {location?.status || "Coming soon..."}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-gray-600">{location?.area}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Review Form */}
      <section className="py-5 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900">
                Get In Touch
              </h2>
              <p className="text-lg text-gray-600 mb-3">
                We'd love to hear from you! Share your experience, ask
                questions, or just say hello.
              </p>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-6 w-6 text-orange-500 mr-3" />
                  <span className="text-gray-700">support@aayuv.in</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-6 w-6 text-orange-500 mr-3" />
                  <span className="text-gray-700">+91 98765 43210</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 text-orange-500 mr-3" />
                  <span className="text-gray-700">Hyderabad, Telangana</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader className="pt-0">
                  <CardTitle>Write a Review & Contact Us</CardTitle>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-1">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <div className="flex items-center space-x-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 cursor-pointer ${
                              star <= formData.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                            onClick={() =>
                              setFormData({ ...formData, rating: star })
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Your Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your experience or ask us anything..."
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full !mt-4"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Review
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default AboutUs;
