import { createBrowserRouter, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';
import SecretAppDashboard from '@/pages/secrets-app/dashboard/SecretAppDashboard';
import LoginPage from '@/pages/auth/LoginPage';
import AuthLayout from '@/layouts/AuthLayout';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorPage from '@/pages/common/ErrorPage';
import NotFoundPage from '@/pages/common/NotFoundPage';
import RootRouteHandler from './RootRouteHandler';
import AssetsPage from '@/pages/secrets-app/asset/AssetsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import SecretLayout from '@/layouts/SecretLayout';
import MainLayout from '@/layouts/MainLayout';
import ScansPage from '@/pages/secrets-app/scans/ScansPage';
import IncidentsPage from '@/pages/secrets-app/incidents/IncidentsPage';
import SCAAppDashboard from '@/pages/sca-app/dashboard/ScaAppDashboard';
import ScaLayout from '@/layouts/ScaLayout';
import ScaAssetsPage from '@/pages/sca-app/asset/ScaAssetsPage';
import ScaScansPage from '@/pages/sca-app/scans/ScaScansPage';
import ScaIncidentsPage from '@/pages/sca-app/incidents/ScaIncidentsPage';
import TokenPage from '@/pages/auth/TokenPage';
import SSOAuth from '@/pages/auth/SSOAuth';
import HelpPage from '@/pages/help/HelpPage';
import VMLayout from '@/layouts/VMLayout';
import VMAppDashboard from '@/pages/vm-app/dashboard/VMAppDashboard';
import VMAssetsPage from '@/pages/vm-app/asset/VMAssetsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRouteHandler />,
  },
  {
    element: <SecretLayout />,
    children: [
      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/secret/dashboard',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <SecretAppDashboard />
              </ErrorBoundary>
            ),
          },

          {
            path: '/secret/assets',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <AssetsPage />
              </ErrorBoundary>
            ),
          },

          {
            path: '/secret/scans',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <ScansPage />
              </ErrorBoundary>
            ),
          },

          {
            path: '/secret/incidents',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <IncidentsPage />
              </ErrorBoundary>
            ),
          },
        ],
      },
    ],
  },
  {
    element: <ScaLayout />,
    children: [
      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/sca/dashboard',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <SCAAppDashboard />
              </ErrorBoundary>
            ),
          },
        ],
      },

      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/sca/assets',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <ScaAssetsPage />
              </ErrorBoundary>
            ),
          },
        ],
      },

      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/sca/scans',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <ScaScansPage />
              </ErrorBoundary>
            ),
          },
        ],
      },

      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/sca/incidents',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <ScaIncidentsPage />
              </ErrorBoundary>
            ),
          },
        ],
      },
    ],
  },

  {
    element: <VMLayout />,
    children: [
      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/vm/dashboard',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <VMAppDashboard />
              </ErrorBoundary>
            ),
          },
        ],
      },

      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/vm/assets',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <VMAssetsPage />
              </ErrorBoundary>
            ),
          },
        ],
      },

      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/vm/scans',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <ScaScansPage />
              </ErrorBoundary>
            ),
          },
        ],
      },

      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/vm/incidents',
            element: (
              <ErrorBoundary fallback={<ErrorPage />}>
                <ScaIncidentsPage />
              </ErrorBoundary>
            ),
          },
        ],
      },
    ],
  },

  {
    element: <AuthLayout />,
    children: [
      {
        element: <PublicRoute />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
          {
            path: '/token',
            element: <TokenPage />,
          },
          {
            path: '/sso/callback',
            element: <SSOAuth />,
          },
        ],
      },
    ],
  },

  {
    element: <MainLayout />,
    children: [
      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },

  {
    element: <MainLayout />,
    children: [
      {
        element: <PrivateRoute />,
        children: [
          {
            path: '/help',
            element: <HelpPage />,
          },
        ],
      },
    ],
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
