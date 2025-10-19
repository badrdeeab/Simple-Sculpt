import { NavLink, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Navbar = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">Simple Sculpt</div>
      <div className="nav-links">
        <NavLink to="/today" className={({ isActive }) => (isActive ? 'active' : '')}>
          Today
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>
          History
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
          Settings
        </NavLink>
      </div>
      <button className="button secondary" onClick={handleSignOut} type="button">
        Sign out
      </button>
    </nav>
  );
};

export default Navbar;
