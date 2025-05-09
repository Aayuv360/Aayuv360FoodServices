import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useRazorpay } from '@/hooks/use-razorpay';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  id: number;
  mealId: number;
  quantity: number;
  price: number;
  meal?: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
  };
}

interface Order {
  id: number;
  userId: number;
  status: string;
  totalPrice: number;
  deliveryTime: string;
  deliveryAddress: string;
  createdAt: string;
  items: OrderItem[];
}

const Checkout = () => {
  const [match, params] = useRoute<{ orderId: string }>('/checkout/:orderId');
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { initiatePayment, isLoading: paymentLoading } = useRazorpay();
  
  // Fetch order details if we have an orderId
  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ['/api/orders', params?.orderId],
    queryFn: async () => {
      if (!params?.orderId) return null;
      const res = await apiRequest('GET', `/api/orders/${params.orderId}`);
      return await res.json();
    },
    enabled: !!params?.orderId && !!user,
  });

  // Handle payment success
  const handlePaymentSuccess = (paymentData: any) => {
    toast({
      title: 'Payment Successful',
      description: 'Your order has been confirmed',
    });
    // Redirect to success page
    setLocation(`/payment-success?orderId=${params?.orderId}`);
  };

  // Handle payment failure
  const handlePaymentFailure = (error: any) => {
    toast({
      title: 'Payment Failed',
      description: error.message || 'Failed to process payment',
      variant: 'destructive',
    });
  };

  // Handle payment button click
  const handlePaymentClick = () => {
    if (!order) return;
    
    initiatePayment({
      amount: order.totalPrice,
      orderId: order.id,
      description: `Payment for Order #${order.id}`,
      name: 'Aayuv Millet Foods',
      theme: { color: '#9E6D38' }, // Use brand color
      onSuccess: handlePaymentSuccess,
      onFailure: handlePaymentFailure,
    });
  };

  if (authLoading || orderLoading) {
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

  if (!match || !order) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Order</h1>
        <p>The order you are trying to access does not exist or you don't have permission to view it.</p>
        <Button className="mt-4" onClick={() => setLocation('/')}>
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Order #{order.id} placed on {new Date(order.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Order items</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.meal?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.meal?.description?.substring(0, 60)}
                            {(item.meal?.description?.length || 0) > 60 ? '...' : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.price / 100}</TableCell>
                      <TableCell className="text-right">₹{(item.price * item.quantity) / 100}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Delivery Address:</span> {order.deliveryAddress}
                </div>
                {order.deliveryTime && (
                  <div>
                    <span className="font-medium">Expected Delivery:</span>{' '}
                    {new Date(order.deliveryTime).toLocaleString()}
                  </div>
                )}
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
                  <span>Subtotal:</span>
                  <span>₹{order.totalPrice / 100}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span>₹0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₹{order.totalPrice / 100}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handlePaymentClick}
                disabled={paymentLoading || order.status !== 'pending'}
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  order.status === 'pending' ? 'Pay Now' : 'Order Already Processed'
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              By clicking "Pay Now", you agree to our terms of service and privacy policy.
              Your payment will be processed securely by Razorpay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;