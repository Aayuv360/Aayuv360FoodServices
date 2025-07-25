import { useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export default function LoginForm({
  onSuccess,
  onForgotPassword,
}: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.username, values.password);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm">
                Email or Username
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your username"
                  className="text-xs sm:text-sm h-8 sm:h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  className="text-xs sm:text-sm h-8 sm:h-10"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <div className="float-right !my-1">
          <Button
            type="button"
            variant="link"
            className="w-full h-auto"
            onClick={(e) => {
              e.preventDefault();
              onForgotPassword?.();
            }}
            disabled={isLoading}
          >
            Forgot Password?
          </Button>
        </div>
        <div className="space-y-2">
          <Button
            type="submit"
            className="w-full text-xs sm:text-sm h-auto py-1.5 sm:py-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
