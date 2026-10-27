import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in both email and password.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await login(email, password);
            navigate(from, { replace: true });
        }
        catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleQuickLogin = async (demoEmail, demoPass) => {
        try {
            setLoading(true);
            setError(null);
            setEmail(demoEmail);
            setPassword(demoPass);
            await login(demoEmail, demoPass);
            navigate(from, { replace: true });
        }
        catch (err) {
            setError(err.message || 'Quick login failed. Please verify the backend is running.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-[#fbf9f0] flex flex-col items-center justify-center p-6 selection:bg-[#c6f26a] selection:text-[#141f00]">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Brand Lockup */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="PrepPulse Logo" className="w-10 h-10 rounded-lg object-contain"/>
            <span className="font-display font-bold text-2xl text-[#1b1c17] tracking-tight">PrepPulse</span>
          </Link>
          <p className="text-sm text-[#454742]">
            Sign in to access your calibrated mock arena and Interview DNA.
          </p>
        </div>

        {/* Login Card */}
        <Card className="flex flex-col gap-5">
          {error && (<div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] text-xs rounded-lg font-medium">
              {error}
            </div>)}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Candidate Email" type="email" placeholder="candidate@preppulse.ai" value={email} onChange={(e) => setEmail(e.target.value)} required/>

            <Input label="Password" type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required/>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" disabled={loading}>
              {loading ? (<span>Authenticating...</span>) : (<>
                  <span>Sign In to Arena</span>
                  <ArrowRight className="w-4 h-4 ml-1"/>
                </>)}
            </Button>
          </form>

          {/* 1-Click Demo Fill */}
          <div className="pt-3 border-t border-[#c6c7c0] flex flex-col gap-2">
            <span className="font-mono text-[11px] text-[#767871] uppercase tracking-wider text-center font-bold">
              Evaluation Quick-Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => {
            setEmail('admin@preppulse.ai');
            setPassword('AdminPassword123!');
        }} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1b1c17] hover:bg-[#30312b] text-[#c6f26a] text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                <Lock className="w-3.5 h-3.5"/>
                <span>Fill Admin</span>
              </button>
              <button type="button" onClick={() => {
            setEmail('arjun.patel@example.com');
            setPassword('ValidPassword123!');
        }} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#f6f4eb] hover:bg-[#eae8df] text-[#1b1c17] text-xs font-semibold rounded-lg border border-[#c6c7c0] transition-colors cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 text-[#4b6700]"/>
                <span>Fill Candidate</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#454742]">
          New candidate?{' '}
          <Link to="/register" className="font-semibold text-[#1b1c17] hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>);
};
