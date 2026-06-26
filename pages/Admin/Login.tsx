import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [step, setStep] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // STEP 1: Verify Password & Send Email OTP
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Authenticate with Password
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Check if user is Admin in your profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('Unauthorized access.');
      setLoading(false);
      return;
    }

    // 3. Password correct? Now trigger Email OTP for Step 2
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false } // Only for existing admin
    });

   if (otpError) {
  setError(otpError.message); // <-- This will show the REAL error!
  console.log("Supabase Error:", otpError); // Prints to your browser console
  setLoading(false);
} else {
      setStep('otp'); // Move to Step 2
      setLoading(false);
    }
  };


  // STEP 2: Verify the 6-Digit Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });

    if (verifyError) {
      setError('Invalid or expired code.');
      setLoading(false);
    } else {
      // 4. Fully Verified -> Go to Dashboard
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500"></div>

        {step === 'password' ? (
          /* --- PASSWORD UI --- */
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ADMIN LOGIN</h1>
            <p className="text-gray-500 text-sm">Step 1: Enter Credentials</p>
            {error && <div className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16}/>{error}</div>}
            
            <input 
              type="email" required placeholder="admin@example.com"
              className="w-full p-3 bg-gray-50 border rounded-lg"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" required placeholder="Password"
              className="w-full p-3 bg-gray-50 border rounded-lg"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            
            <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <>Next Step <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          /* --- OTP UI --- */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center">
              <KeyRound size={48} className="mx-auto text-yellow-500 mb-4" />
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">TWO-STEP VERIFICATION</h1>
              <p className="text-gray-500 text-sm mt-2">Enter the 6-digit code sent to {email}</p>
            </div>

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <input 
              type="text" required maxLength={6} placeholder="000000"
              className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center text-2xl tracking-[1em] font-mono focus:border-gray-900 focus:outline-none"
              value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
            />

            <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
            </button>
            
            <button type="button" onClick={() => setStep('password')} className="w-full text-gray-400 text-xs hover:underline">
              Back to Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;