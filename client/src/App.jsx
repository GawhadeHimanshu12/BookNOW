// client/src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAuth } from './contexts/AuthContext';

import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

import ProtectedRoute from './components/ProtectedRoute';

const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage'));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const OrganizerDashboardPage = lazy(() => import('./pages/OrganizerDashboardPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const WriteReviewPage = lazy(() => import('./pages/WriteReviewPage'));

const OrganizerVenueFormPage = lazy(() => import('./pages/organizer/OrganizerVenueFormPage'));
const OrganizerShowtimeFormPage = lazy(() => import('./pages/organizer/OrganizerShowtimeFormPage'));
const OrganizerEventFormPage = lazy(() => import('./pages/organizer/OrganizerEventFormPage'));

const UserDetailsPage = lazy(() => import('./pages/admin/UserDetailsPage'));

const UserProfileEditPage = lazy(() => import('./pages/UserProfileEditPage'));

const PageLoader = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 128px)', p:3 }}>
        <CircularProgress color="error" />
    </Box>
);

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const loginAndRedirect = async () => {
        const success = await googleLogin(code);
        searchParams.delete('code');
        setSearchParams(searchParams, { replace: true });

        if (success) {
            navigate('/');
        }
      };
      loginAndRedirect();
    }
  }, [searchParams, googleLogin, navigate, setSearchParams]);

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box component="main" sx={{ flexGrow: 1, py: {xs: 1, sm: 2, md:3} }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/resetpassword/:resettoken" element={<ResetPasswordPage />} />
              <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
              <Route path="/events/:eventId" element={<EventDetailsPage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/book/:showtimeId" element={<BookingPage />} />
              <Route
                  path="/dashboard"
                  element={ <ProtectedRoute> <UserDashboardPage /> </ProtectedRoute> }
              />
              <Route
                  path="/booking-confirmation/:bookingId"
                  element={ <ProtectedRoute> <BookingConfirmationPage /> </ProtectedRoute> }
              />
              <Route
                  path="/profile/edit"
                  element={ <ProtectedRoute> <UserProfileEditPage /> </ProtectedRoute> }
              />
               <Route
                  path="/movies/:movieId/review"
                  element={ <ProtectedRoute> <WriteReviewPage /> </ProtectedRoute> }
              />
              <Route
                  path="/organizer" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerDashboardPage /> </ProtectedRoute> }
              />
                <Route
                  path="/organizer/events/new"
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerEventFormPage mode="create" /> </ProtectedRoute> }
              />
              <Route
                  path="/organizer/events/edit/:eventId"
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerEventFormPage mode="edit" /> </ProtectedRoute> }
              />
              <Route 
                  path="/organizer/venues/new" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerVenueFormPage mode="create" /> </ProtectedRoute> } 
              />
              <Route 
                  path="/organizer/venues/edit/:venueId" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerVenueFormPage mode="edit" /> </ProtectedRoute> } 
              />
              <Route 
                  path="/organizer/showtimes/new" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerShowtimeFormPage mode="create" /> </ProtectedRoute> } 
              />
              <Route 
                  path="/organizer/showtimes/edit/:showtimeId" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerShowtimeFormPage mode="edit" /> </ProtectedRoute> } 
              />
               <Route
                  path="/organizer/*" 
                  element={ <ProtectedRoute allowedRoles={['organizer', 'admin']}> <OrganizerDashboardPage /> </ProtectedRoute> }
              />

              {/* --- Admin Routes --- */}
              <Route
                  path="/admin" 
                  element={ <ProtectedRoute allowedRoles={['admin']}> <AdminDashboardPage /> </ProtectedRoute> }
              />
               <Route
                  path="/admin/users/:userId"
                  element={ <ProtectedRoute allowedRoles={['admin']}> <UserDetailsPage /> </ProtectedRoute> }
              />
              <Route
                  path="/admin/*" 
                  element={ <ProtectedRoute allowedRoles={['admin']}> <AdminDashboardPage /> </ProtectedRoute> }
              />
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Box>
        <Footer />
      </Box>
    </>
  );
}

export default App;