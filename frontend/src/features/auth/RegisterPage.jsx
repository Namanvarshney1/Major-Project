import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ArrowRight } from 'lucide-react';
export const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [targetRole, setTargetRole] = useState('Senior Backend Engineer (Java & Distributed Systems)');
    const [targetLevel, setTargetLevel] = useState('L5/Senior IC');
    const [experienceYears, setExperienceYears] = useState(4);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            setError('Please provide your name, email, and password.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await register(name, email, password, {
                target_role: targetRole,
                target_level: targetLevel,
                experience_years: experienceYears,
                primary_language: 'Java',
            });
            navigate('/dashboard', { replace: true });
        }
        catch (err) {
            setError(err.message || 'Registration failed.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-[#fbf9f0] flex flex-col items-center justify-center p-6 selection:bg-[#c6f26a] selection:text-[#141f00]">
      <div className="w-full max-w-lg flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="PrepPulse Logo" className="w-10 h-10 rounded-lg object-contain"/>
            <span className="font-display font-bold text-2xl text-[#1b1c17] tracking-tight">PrepPulse</span>
          </Link>
          <p className="text-sm text-[#454742]">
            Create your candidate profile to establish your Interview DNA baseline.
          </p>
        </div>

        <Card className="flex flex-col gap-5">
          {error && (<div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/40 text-[#93000a] text-xs rounded-lg font-medium">
              {error}
            </div>)}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Candidate Full Name" placeholder="e.g. Arjun Patel" value={name} onChange={(e) => setName(e.target.value)} required/>

            <Input label="Email Address" type="email" placeholder="candidate@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required/>

            <Input label="Password (min 6 characters)" type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required/>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                  Target Role
                </label>
                <select className="w-full px-3 py-2 bg-[#ffffff] border border-[#c6c7c0] rounded-lg text-xs text-[#1b1c17] focus:outline-none focus:border-[#1b1c17]" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                  <option value="Senior Backend Engineer (Java & Distributed Systems)">Senior Backend (Java)</option>
                  <option value="Full-Stack Engineer (React & Python)">Full-Stack (React/Python)</option>
                  <option value="Distributed Systems Architect">Distributed Systems Architect</option>
                  <option value="Frontend Specialist (React/TypeScript)">Frontend Specialist</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#454742] uppercase tracking-wider">
                  Target Level
                </label>
                <select className="w-full px-3 py-2 bg-[#ffffff] border border-[#c6c7c0] rounded-lg text-xs text-[#1b1c17] focus:outline-none focus:border-[#1b1c17]" value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)}>
                  <option value="L3/Junior IC">L3 (Junior)</option>
                  <option value="L4/Mid-Level IC">L4 (Mid-Level)</option>
                  <option value="L5/Senior IC">L5 (Senior)</option>
                  <option value="L6/Staff IC">L6 (Staff)</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2" disabled={loading}>
              {loading ? (<span>Generating Candidate Identity...</span>) : (<>
                  <span>Initialize Profile &amp; Start</span>
                  <ArrowRight className="w-4 h-4 ml-1"/>
                </>)}
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-[#454742]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#1b1c17] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>);
};
