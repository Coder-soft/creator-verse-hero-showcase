import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
    const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
      value || defaultValue
    );

    // Update internal state when the value prop changes
    React.useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    // Handle value changes
    const handleValueChange = (newValue: string) => {
      if (!value) {
        setSelectedValue(newValue);
      }
      onValueChange?.(newValue);
    };

    // Pass the selected value and change handler to the context
    const contextValue = React.useMemo(
      () => ({
        value: selectedValue,
        onValueChange: handleValueChange,
      }),
      [selectedValue]
    );

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div ref={ref} className={cn("grid gap-2", className)} {...props}>
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useRadioGroupContext();
    const isSelected = selectedValue === value;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center space-x-2",
          className
        )}
        {...props}
      >
        <div
          role="radio"
          aria-checked={isSelected}
          onClick={() => onValueChange(value)}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            isSelected && "bg-primary text-primary-foreground",
            "cursor-pointer"
          )}
        >
          {isSelected && (
            <div className="flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-white" />
            </div>
          )}
        </div>
        {children}
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

// Create a context to share the selected value
type RadioGroupContextType = {
  value?: string;
  onValueChange: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextType>({
  onValueChange: () => {},
});

const useRadioGroupContext = () => {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error(
      "RadioGroupItem must be used within a RadioGroup"
    );
  }
  return context;
};

export { RadioGroup, RadioGroupItem }; 