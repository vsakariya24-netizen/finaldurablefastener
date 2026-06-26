// AdminRoute.tsx
import { JSX, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAdmin(false);
        return;
      }
      const { data: adminData } = await supabase
        .from('admins')
        .select('email')
        .eq('email', session.user.email)
        .single();
      setIsAdmin(!!adminData);
    };
    checkAdmin();
  }, []);

  if (isAdmin === null) return <div>Loading...</div>;
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
};