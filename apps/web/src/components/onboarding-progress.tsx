'use client';

import { Check } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: 1 | 2 | 3;
}

export default function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const steps = [
    { number: 1, label: 'Welcome' },
    { number: 2, label: 'Company Setup' },
    { number: 3, label: 'Add Employees' },
  ];

  return (
    <div className="flex items-center justify-center space-x-4 md:space-x-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isCurrent
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-medium ${
                  isCurrent ? 'text-stone-900' : 'text-stone-500'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-16 md:w-24 transition-all ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-stone-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
