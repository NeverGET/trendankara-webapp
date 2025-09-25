import * as React from "react";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import { Alert as ReUIAlert, AlertDescription, AlertTitle } from "@/components/ui/alert-reui";
import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantConfig = {
  default: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: ''
  },
  success: {
    icon: <CheckCircle className="h-4 w-4" />,
    className: 'border-green-500 text-green-500 [&>svg]:text-green-500'
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    className: 'border-red-500 text-red-500 [&>svg]:text-red-500'
  },
  warning: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'border-yellow-500 text-yellow-500 [&>svg]:text-yellow-500'
  },
  info: {
    icon: <Info className="h-4 w-4" />,
    className: 'border-blue-500 text-blue-500 [&>svg]:text-blue-500'
  }
};

export function Alert({
  variant = 'default',
  title,
  children,
  className,
  icon,
  dismissible = false,
  onDismiss
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible && dismissible) return null;

  const config = variantConfig[variant] || variantConfig.default;
  const displayIcon = icon || config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <ReUIAlert className={cn(config.className, className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {displayIcon}
          <div className="flex-1">
            {title && <AlertTitle>{title}</AlertTitle>}
            <AlertDescription>{children}</AlertDescription>
          </div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-auto p-1 hover:opacity-70 transition-opacity"
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </ReUIAlert>
  );
}

export default Alert;