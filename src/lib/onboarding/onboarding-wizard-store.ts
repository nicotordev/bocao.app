"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { OnboardingFormValues } from "@/lib/onboarding/schema";

const STEP_IDS = [1, 2, 3] as const;

type StepId = (typeof STEP_IDS)[number];

export const defaultOnboardingValues: OnboardingFormValues = {
  organizationName: "",
  restaurantName: "",
  country: "CL",
  currency: "CLP",
  timezone: "America/Santiago",
  primaryGoal: "ORDERS",
  city: "",
  phone: "",
  businessType: undefined,
  serviceModes: [],
};

type OnboardingWizardStoreState = {
  hasHydrated: boolean;
  step: StepId;
  values: OnboardingFormValues;
};

type OnboardingWizardStoreActions = {
  setHasHydrated: (value: boolean) => void;
  setStep: (step: number) => void;
  updateValues: (patch: Partial<OnboardingFormValues>) => void;
  reset: () => void;
};

const clampStep = (step: number): StepId => {
  if (step <= STEP_IDS[0]) {
    return STEP_IDS[0];
  }

  if (step >= STEP_IDS[STEP_IDS.length - 1]) {
    return STEP_IDS[STEP_IDS.length - 1];
  }

  return step as StepId;
};

type OnboardingWizardStore = OnboardingWizardStoreState &
  OnboardingWizardStoreActions;

const initialState: OnboardingWizardStoreState = {
  hasHydrated: false,
  step: STEP_IDS[0],
  values: defaultOnboardingValues,
};

export const useOnboardingWizardStore = create<OnboardingWizardStore>()(
  persist(
    (set) => ({
      ...initialState,
      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },
      setStep: (step) => {
        set({ step: clampStep(step) });
      },
      updateValues: (patch) => {
        set((state) => ({
          values: {
            ...state.values,
            ...patch,
          },
        }));
      },
      reset: () => {
        set((state) => ({
          ...initialState,
          hasHydrated: state.hasHydrated,
        }));
      },
    }),
    {
      name: "onboarding-wizard-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        step: state.step,
        values: state.values,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
