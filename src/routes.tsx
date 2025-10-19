import { useRoutes } from 'react-router-dom';
import Login from './pages/Login';
import Today from './pages/Today';
import History from './pages/History';
import Settings from './pages/Settings';

export const AppRoutes = () =>
  useRoutes([
    { path: '/', element: <Today /> },
    { path: '/login', element: <Login /> },
    { path: '/today', element: <Today /> },
    { path: '/history', element: <History /> },
    { path: '/settings', element: <Settings /> }
  ]);

export default AppRoutes;
