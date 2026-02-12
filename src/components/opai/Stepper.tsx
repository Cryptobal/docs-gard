import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}

/**
 * Stepper - Indicador de progreso por pasos
 * 
 * Muestra una línea de progreso con círculos para cada paso.
 */
export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  const progressPct =
    steps.length > 0 ? Math.max(0, Math.min(100, ((currentStep + 1) / steps.length) * 100)) : 0;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="h-0.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                isCompleted && "border-primary/40 bg-primary/10 text-primary",
                isCurrent && "border-primary bg-primary text-primary-foreground",
                !isCompleted && !isCurrent && "border-border bg-background text-muted-foreground",
                onStepClick && "cursor-pointer hover:bg-accent/50",
                !onStepClick && "cursor-default"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary-foreground/15 text-primary-foreground",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap",
                  isCurrent && "text-primary-foreground",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
