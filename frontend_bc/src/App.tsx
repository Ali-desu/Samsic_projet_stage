import './App.css';
import { ThemeProvider } from '@/components/themeProvider';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/features/auth/authContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import BCList from '@/features/bon_de_commande/bcList';
import BCForm from '@/features/bon_de_commande/bcForm';
import BCDetails from '@/features/bon_de_commande/bcDetail';
import LoginForm from '@/app/login/page';
import Layout from '@/app/layout';
import Dashboard from '@/app/dashboard';
import PrestationsPage from '@/app/back_office/prestations';
import SuiviList from './features/prestation/SuiviList';
import CoordinatorSuiviList from '@/app/coordinator/SuiviList';
import Inbox from '@/components/shared/inbox';
import ChefBCPage from '@/app/chef/bc';
import ChefPrestationsPage from '@/app/chef/prestations';
import ChefSuiviPage from '@/app/chef/suivi';
import Boq from './app/back_office/boq';
import OTForm from './app/back_office/OtForm';
import BCDetailsTable from './app/back_office/BcDetail';
import BCSummary from './app/back_office/BcSummary';
import BcSummarychef from '@/app/chef/BcSummaryChef';
import Bcdetailschef from '@/app/chef/BcDetailChef';
import Sites from './app/back_office/Sites';
import UserManagement from './app/chef/userManagement';
import SetPassword from './components/shared/setPassword';
import LinkOtToBdc from './app/back_office/LinkOtsToBdc';

function NotAuthorized() {
  return <div className="flex items-center justify-center min-h-screen text-2xl text-red-600">Accès non autorisé</div>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/not-authorized" element={<NotAuthorized />} />
                <Route path="/app/set-password" element={<SetPassword />} />
                <Route
                  path="/app/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="back_office/ot" element={<ProtectedRoute roles={["back_office"]}><OTForm /></ProtectedRoute>} />
                          <Route path="back_office/bcresume" element={<ProtectedRoute roles={["back_office"]}><BCSummary /></ProtectedRoute>} />
                          <Route path="back_office/bcdetail" element={<ProtectedRoute roles={["back_office"]}><BCDetailsTable /></ProtectedRoute>} />
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route path="back_office/boq" element={<ProtectedRoute roles={["back_office", "chef_projet"]}><Boq /></ProtectedRoute>} />
                          
                          <Route path="back_office/link" element={<ProtectedRoute roles={["back_office", "chef_projet"]}><LinkOtToBdc /></ProtectedRoute>} />

                          <Route path="bc" element={<ProtectedRoute roles={["back_office","chef_projet"]}><BCList /></ProtectedRoute>} />
                          <Route path="back_office/bc/new" element={<ProtectedRoute roles={["back_office"]}><BCForm /></ProtectedRoute>} />
                          <Route path="back_office/bc/edit/:num_bc" element={<ProtectedRoute roles={["back_office"]}><BCForm /></ProtectedRoute>} />
                          <Route path="back_office/sites" element={<ProtectedRoute roles={["back_office"]}><Sites /></ProtectedRoute>} />
                          <Route path="back_office/bc/:num_bc" element={<ProtectedRoute roles={["back_office"]}><BCDetails /></ProtectedRoute>} />
                          <Route path="back_office/prestations" element={<ProtectedRoute roles={["back_office"]}><PrestationsPage /></ProtectedRoute>} />
                          <Route path="prestation/:id" element={<ProtectedRoute roles={["coordinateur", "back_office", "chef_projet"]}><SuiviList /></ProtectedRoute>} />
                          <Route path="coordinator/suivi" element={<ProtectedRoute roles={["coordinateur"]}><CoordinatorSuiviList /></ProtectedRoute>} />
                          <Route path="chef/bc" element={<ProtectedRoute roles={["chef_projet"]}><ChefBCPage /></ProtectedRoute>} />
                          <Route path="chef/add-user" element={<ProtectedRoute roles={["chef_projet"]}><UserManagement /></ProtectedRoute>} />
                          <Route path="chef/prestations" element={<ProtectedRoute roles={["chef_projet"]}><ChefPrestationsPage /></ProtectedRoute>} />
                          <Route path="chef/suivi" element={<ProtectedRoute roles={["chef_projet"]}><ChefSuiviPage /></ProtectedRoute>} />
                          <Route path="inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                          <Route path="chef/resumett" element={<ProtectedRoute roles={["chef_projet"]}><BcSummarychef /></ProtectedRoute>} />
                          <Route path="chef/detailstt" element={<ProtectedRoute roles={["chef_projet"]}><Bcdetailschef /></ProtectedRoute>} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;