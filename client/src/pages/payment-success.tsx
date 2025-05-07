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
    if (!user) {
      return;  // Make sure user is authenticated
    }

    const completeSubscriptionProcess = async () => {
      try {
        // Get the pending subscription data from session storage
        const pendingSubscriptionData = sessionStorage.getItem('pendingSubscription');
        const pendingMealSelections = sessionStorage.getItem('pendingMealSelections');
        
        if (!pendingSubscriptionData) {
          setIsProcessing(false);
          return;
        }
        
        const subscriptionData = JSON.parse(pendingSubscriptionData);
        
        // Now create the actual subscription
        const res = await apiRequest("POST", "/api/subscriptions", {
          ...subscriptionData,
          isActive: true
        });
        
        const subscription = await res.json();
        
        // If there are custom meal selections, save them
        if (pendingMealSelections && subscription.id) {
          const mealSelections = JSON.parse(pendingMealSelections);
          
          // Save each meal selection
          const customMealPromises = mealSelections.map((selection: any) => 
            apiRequest("POST", "/api/custom-meal-plans", {
              subscriptionId: subscription.id,
              dayOfWeek: selection.dayOfWeek,
              mealId: selection.mealId
            })
          );
          
          await Promise.all(customMealPromises);
        }
        
        // Clear the session storage
        sessionStorage.removeItem('pendingSubscription');
        sessionStorage.removeItem('pendingMealSelections');
        
        // Update the cache
        queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
        
        // Show success message
        toast({
          title: "Subscription created!",
          description: "Your subscription has been created successfully.",
        });
        
        setProcessed(true);
      } catch (error: any) {
        console.error("Error completing subscription:", error);
        toast({
          title: "Error completing subscription",
          description: error.message || "There was an error completing your subscription",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Process the payment result
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
    const redirectStatus = urlParams.get('redirect_status');
    
    // Validate the payment was successful
    if (redirectStatus === 'succeeded' && paymentIntent && paymentIntentClientSecret) {
      completeSubscriptionProcess();
    } else {
      setIsProcessing(false);
      toast({
        title: "Payment verification failed",
        description: "We couldn't verify your payment status. Please contact support.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">Finalizing your subscription...</p>
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
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                {processed 
                  ? "Your subscription has been created successfully." 
                  : "Your payment was processed successfully."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                Thank you for subscribing to MealMillet. We're excited to start serving you delicious millet-based meals!
              </p>
              <p className="text-gray-600">
                You'll receive a confirmation email shortly with all the details of your subscription.
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