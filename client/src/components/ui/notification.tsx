import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Bell, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const notificationVariants = cva(
  "relative flex w-full items-center rounded-md border p-4 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        success: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
        error: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
        warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant, title, description, icon, onClose, ...props }, ref) => {
    // Choose the appropriate icon based on the variant
    const IconComponent = React.useMemo(() => {
      if (icon) return icon;

      switch (variant) {
        case "success":
          return <CheckCircle2 className="h-5 w-5" />;
        case "error":
          return <XCircle className="h-5 w-5" />;
        case "warning":
          return <AlertCircle className="h-5 w-5" />;
        case "info":
          return <Info className="h-5 w-5" />;
        default:
          return <Bell className="h-5 w-5" />;
      }
    }, [variant, icon]);

    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{IconComponent}</div>
          <div className="flex-1">
            {title && <h4 className="font-medium">{title}</h4>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <span className="sr-only">Close</span>
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Notification.displayName = "Notification";

export { Notification, notificationVariants };