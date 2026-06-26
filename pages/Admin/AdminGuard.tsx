import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

const AdminGuard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        // 1. Get current authenticated user session securely from Supabase server
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // 2. Double-check database role profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profileError && profile?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // Sign out immediately if a malicious user bypassed the frontend state
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.error("Security check failed:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-500" size={48} />
      </div>
    );
  }

  // If verified admin, render the children components (via Outlet); otherwise redirect
  return isAdmin ? <Outlet /> : <Navigate to="/df-secure-login" replace />;
};

export default AdminGuard;