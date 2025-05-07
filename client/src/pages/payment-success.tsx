import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle, Home, ShoppingBag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function PaymentSuccess() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processed, setProcessed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // In our simplified payment flow, we don't need to process anything
    // Orders/subscriptions are created directly in the checkout page
    setTimeout(() => {
      setIsProcessing(false);
      setProcessed(true);
      
      // Show success message
      toast({
        title: "Order completed!",
        description: "Your order has been processed successfully.",
      });
    }, 1500);
  }, [toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">Finalizing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-light py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-2" />
              <CardTitle className="text-2xl">Order Successful!</CardTitle>
              <CardDescription>
                {processed 
                  ? "Your order has been created successfully." 
                  : "Your order was processed successfully."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Thank you for ordering from MealMillet. We're excited to start serving you delicious millet-based meals!
              </p>
              <p className="text-gray-600">
                You'll receive a confirmation email shortly with all the details of your order.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button asChild>
                <Link href="/profile?tab=subscriptions">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View Subscriptions
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}