import { redirect } from 'next/navigation';

export default function OnboardingPage() {
  // Redirect to welcome page by default
  redirect('/onboarding/welcome');
}
