import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProfessionalLoader } from '@/components/Common/ProfessionalLoader';
import { ProtectedRoute } from '@/components/Common/ProtectedRoute';

// Marketing & Auth
const LandingPage = lazy(() => import('../marketing/LandingPage'));
const LoginPage = lazy(() => import('../auth/pages/LoginPage'));
const SignupPage = lazy(() => import('../auth/pages/SignupPage'));
const VerifyEmailPage = lazy(() => import('../auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../auth/pages/ResetPasswordPage'));

// App / Dashboard
const DashboardPage = lazy(() => import('../dashboard/pages/DashboardPage'));
const OnboardingPage = lazy(() => import('../onboarding/pages/OnboardingPage'));

const NotFoundPage = lazy(() => import('../../pages/NotFoundPage'));

export const SaaSRouter: React.FC = () => {
  return (
    <Suspense fallback={<ProfessionalLoader fullPage={true} text="Loading Orufy..." />}>
      <Routes>
        {/* PUBLIC MARKETING & AUTH */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* PROTECTED ONBOARDING & DASHBOARD */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/*" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
