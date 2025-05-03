import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  // Default form values
  const defaultValues: LoginFormValues = {
    username: "",
    password: "",
  };

  // Form setup
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues,
  });

  // Form submission handler
  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.username, values.password);
      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-light py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-dark">Welcome Back</h1>
          <p className="text-gray-600 mt-2">
            Login to access your MealMillet subscription
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link href="/register">
              <a className="text-primary hover:underline">Register</a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
