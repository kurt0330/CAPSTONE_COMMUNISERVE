// PATH: /src/app/register/customer/page.js
// Customer registration — two-phase flow:
//   Phase 1: Collect fields, create Supabase Auth user, insert public.users + customers
//   Phase 2: Show OTP prompt, user enters 6-digit code to verify email
// Uses Custom Resend API OTP

import RegisterForm from '@/components/customer/RegisterForm';

export const metadata = {
  title: 'Register — CommuniServe',
};

export default function CustomerRegistrationPage() {
  return <RegisterForm />;
}