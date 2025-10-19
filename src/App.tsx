import Navbar from './components/Navbar';
import { AppRoutes } from './routes';
import { AuthProvider, useAuth } from './hooks/useAuth';

const Layout = () => {
  const { user, loading } = useAuth();

  return (
    <div className="app-container">
      {!loading && user ? <Navbar /> : null}
      <main className="page-container">
        <AppRoutes />
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <Layout />
  </AuthProvider>
);

export default App;
