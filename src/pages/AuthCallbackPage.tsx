import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/legacyDb';

type Status = 'loading' | 'success' | 'error' | 'already_verified';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase JS v2 automatically exchanges the token/code from the URL
        // when getSession() is called. We just need to wait for it.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMsg(error.message);
          setStatus('error');
          return;
        }

        if (session?.user) {
          // Already fully verified and signed in from this link
          const confirmedAt = session.user.email_confirmed_at;
          const userEmail = session.user.email || '';
          setEmail(userEmail);

          if (confirmedAt) {
            setStatus('success');
          } else {
            setStatus('already_verified');
          }
          return;
        }

        // No session yet — listen for the SDK to process the URL tokens.
        // This fires when the PKCE code or implicit hash token is exchanged.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (event === 'SIGNED_IN' && newSession?.user) {
              subscription.unsubscribe();
              const userEmail = newSession.user.email || '';
              setEmail(userEmail);
              // Sign out immediately so the user lands on a clean login screen.
              // They've verified; now they log in with their credentials.
              await supabase.auth.signOut();
              setStatus('success');
            } else if (event === 'TOKEN_REFRESHED') {
              // ignore
            }
          }
        );

        // Safety timeout — if nothing fires after 8s, show an error
        setTimeout(() => {
          subscription.unsubscribe();
          setStatus(prev => prev === 'loading' ? 'error' : prev);
          setErrorMsg('Verification timed out. The link may have expired.');
        }, 8000);

      } catch (err: any) {
        setErrorMsg(err?.message || 'Something went wrong.');
        setStatus('error');
      }
    };

    handleCallback();
  }, []);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <></>
          <p className="text-gray-600 font-medium">Verifying your email…</p>
          <p className="text-gray-400 text-sm mt-1">This only takes a moment.</p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-9 w-9 text-green-500" />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Email verified!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your account is ready. Sign in below to continue.
          </p>

          {email && (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-left">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 font-medium truncate">{email}</span>
            </div>
          )}

          <Link
            to={`/auth?mode=login${email ? `&email=${encodeURIComponent(email)}` : ''}`}
            className="block w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors duration-150"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    );
  }

  // ── Already verified / signed in ─────────────────────────────────────────
  if (status === 'already_verified') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-9 w-9 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">You're verified!</h1>
          <p className="text-gray-500 text-sm mb-6">Your email is confirmed and you're signed in.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="block w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors duration-150"
          >
            Go to my account
          </button>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="h-9 w-9 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Verification failed</h1>
        <p className="text-gray-500 text-sm mb-2">
          {errorMsg || 'This link may have expired or already been used.'}
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Verification links expire after 24 hours. Request a new one by signing up again or contacting support.
        </p>
        <Link
          to="/auth?mode=signup"
          className="block w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl transition-colors duration-150 mb-3"
        >
          Try signing up again
        </Link>
        <Link
          to="/auth"
          className="block w-full text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
