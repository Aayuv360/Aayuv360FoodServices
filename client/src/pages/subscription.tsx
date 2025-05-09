import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useRazorpay } from '@/hooks/use-razorpay';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Subscription {
  id: number;
  userId: number;
  planType: string;
  subscriptionType: string;
  amount: number;
  status: string;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  dietaryPreference: string;
  personCount: number;
}

const SubscriptionPage = () => {
  const [match, params] = useRoute<{ subscriptionId: string }>('/subscription/:subscriptionId');
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { initiatePayment, isLoading: paymentLoading } = useRazorpay();
  
  // Fetch subscription details if we have a subscriptionId
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ['/api/subscriptions', params?.subscriptionId],
    queryFn: async () => {
      if (!params?.subscriptionId) return null;
      const res = await apiRequest('GET', `/api/subscriptions/${params.subscriptionId}`);
      return await res.json();
    },
    enabled: !!params?.subscriptionId && !!user,
  });

  // Handle payment success
  const handlePaymentSuccess = (paymentData: any) => {
    toast({
      title: 'Subscription Activated',
      description: 'Your subscription has been activated successfully',
    });
    // Redirect to success page
    setLocation(`/profile?tab=subscriptions`);
  };

  // Handle payment failure
  const handlePaymentFailure = (error: any) => {
    toast({
      title: 'Payment Failed',
      description: error.message || 'Failed to process subscription payment',
      variant: 'destructive',
    });
  };

  // Handle payment button click
  const handlePaymentClick = () => {
    if (!subscription) return;
    
    initiatePayment({
      amount: subscription.amount,
      orderId: subscription.id, // Using subscription ID as order ID for now
      description: `Payment for ${subscription.planType} Subscription`,
      name: 'Aayuv Millet Foods',
      theme: { color: '#9E6D38' }, // Use brand color
      onSuccess: handlePaymentSuccess,
      onFailure: handlePaymentFailure,
    });
  };

  if (authLoading || subscriptionLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    useEffect(() => {
      setLocation('/auth');
    }, [setLocation]);
    return null;
  }

  if (!match || !subscription) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Subscription</h1>
        <p>The subscription you are trying to access does not exist or you don't have permission to view it.</p>
        <Button className="mt-4" onClick={() => setLocation('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  // Format the price for display
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(subscription.amount / 100);

  // Calculate duration in months
  const startDate = new Date(subscription.startDate);
  const endDate = new Date(subscription.endDate);
  const durationMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth());

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Subscription Details</h1>
        <p className="text-muted-foreground mb-8">Review your subscription details before payment</p>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl capitalize">{subscription.planType} Plan</CardTitle>
                    <CardDescription>
                      {subscription.subscriptionType === 'default' ? 'Default Meal Plan' : 'Customized Meal Plan'}
                    </CardDescription>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'outline'} className="uppercase">
                    {subscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                    <p className="font-medium">{new Date(subscription.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Next Billing</h3>
                    <p className="font-medium">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Dietary Preference</h3>
                    <p className="font-medium capitalize">{subscription.dietaryPreference}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Person Count</h3>
                    <p className="font-medium">{subscription.personCount} {subscription.personCount > 1 ? 'persons' : 'person'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Plan Duration</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
                        <span className="text-xs text-muted-foreground block">Start</span>
                        <span className="font-medium">{new Date(subscription.startDate).toLocaleDateString()}</span>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                      
                      <div className="text-center">
                        <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
                        <span className="text-xs text-muted-foreground block">End</span>
                        <span className="font-medium">{new Date(subscription.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-center mt-2 text-sm text-muted-foreground">
                      Duration: {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">What's Included</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mr-2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs">✓</span>
                      </div>
                      <span>Daily dinner delivery from our rotating menu of 30 millet-based dishes</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs">✓</span>
                      </div>
                      <span>{subscription.subscriptionType === 'customized' ? 'Personalized meal selection' : 'Curated meal selection by our chefs'}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs">✓</span>
                      </div>
                      <span>Nutrition information for all meals</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xs">✓</span>
                      </div>
                      <span>Free delivery within Hyderabad service areas</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{subscription.planType} Plan:</span>
                    <span>{formattedPrice}</span>
                  </div>
                  
                  {subscription.personCount > 1 && (
                    <div className="flex justify-between">
                      <span>Multiple Persons:</span>
                      <span>x{subscription.personCount}</span>
                    </div>
                  )}
                  
                  {subscription.dietaryPreference !== 'vegetarian' && (
                    <div className="flex justify-between">
                      <span>Dietary Preference:</span>
                      <span className="capitalize">{subscription.dietaryPreference}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formattedPrice}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Billed {subscription.planType === 'monthly' ? 'monthly' : 'weekly'}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handlePaymentClick}
                  disabled={paymentLoading || subscription.status !== 'pending'}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    subscription.status === 'pending' ? 'Activate Subscription' : 'Subscription Active'
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                By activating your subscription, you agree to our terms of service and privacy policy.
                Your payment will be processed securely by Razorpay.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;