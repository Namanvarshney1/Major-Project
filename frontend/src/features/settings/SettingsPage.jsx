import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, Trash2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
export const SettingsPage = () => {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [targetLevel, setTargetLevel] = useState('');
    const [experienceYears, setExperienceYears] = useState(0);
    const [primaryLanguage, setPrimaryLanguage] = useState('');
    const [timedModeDefault, setTimedModeDefault] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setTargetRole(user.profile?.target_role || 'Full-Stack Engineer');
            setTargetLevel(user.profile?.target_level || 'Mid');
            setExperienceYears(user.profile?.experience_years || 2);
            setPrimaryLanguage(user.profile?.primary_language || 'TypeScript');
            setTimedModeDefault(user.preferences?.timed_mode_default ?? true);
        }
    }, [user]);
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setErrorMsg(null);
            setSuccessMsg(null);
            await api.auth.updateProfile({
                name,
                profile: {
                    target_role: targetRole,
                    target_level: targetLevel,
                    experience_years: Number(experienceYears),
                    primary_language: primaryLanguage,
                },
                preferences: {
                    timed_mode_default: timedModeDefault,
                    theme: 'ivory',
                    sound_enabled: true,
                },
            });
            await refreshUser();
            setSuccessMsg('Profile configuration persisted successfully.');
            setTimeout(() => setSuccessMsg(null), 4000);
        }
        catch (err) {
            setErrorMsg(err.message || 'Failed to update preferences.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteAccount = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }
        try {
            setDeleting(true);
            await api.auth.deleteAccount();
            logout();
            navigate('/login');
        }
        catch (err) {
            setErrorMsg(err.message || 'Failed to delete account.');
            setDeleting(false);
        }
    };
    return (<div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">
              Account Preferences & Configuration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-secondary"/>
            System Settings
          </h1>
        </div>
      </div>

      {successMsg && (<div className="p-4 bg-secondary-container/30 border border-secondary/40 rounded-xl flex items-center gap-3 text-xs text-on-surface">
          <CheckCircle2 className="w-4 h-4 text-secondary shrink-0"/>
          <span>{successMsg}</span>
        </div>)}

      {errorMsg && (<div className="p-4 bg-error-container/30 border border-error/40 rounded-xl flex items-center gap-3 text-xs text-on-surface">
          <AlertTriangle className="w-4 h-4 text-error shrink-0"/>
          <span>{errorMsg}</span>
        </div>)}

      {/* Profile & Target Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="text-base font-bold tracking-tight">Candidate Profile & Target Role</h2>
            <p className="text-xs text-on-surface-variant">
              The AI Coach uses these parameters to tailor difficulty levels and question domains.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Arjun Patel" required/>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                Email Address
              </label>
              <input type="text" disabled value={user?.email || ''} className="w-full px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-xs font-mono text-on-surface-variant cursor-not-allowed"/>
              <span className="text-[10px] font-mono text-on-surface-variant mt-1 block">
                Primary identifier cannot be modified.
              </span>
            </div>

            <Input label="Target Engineering Role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Backend Engineer, Systems Engineer" required/>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1.5 font-bold">
                Target Seniority Level
              </label>
              <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} className="w-full py-2 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-mono focus:outline-none focus:border-primary transition-colors">
                <option value="Junior">Junior (0-2 YOE)</option>
                <option value="Mid">Mid-Level (2-5 YOE)</option>
                <option value="Senior">Senior (5-8 YOE)</option>
                <option value="Staff">Staff / Principal (8+ YOE)</option>
              </select>
            </div>

            <Input label="Years of Industry Experience" type="number" min="0" max="40" value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} required/>

            <Input label="Primary Tech / Language" value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value)} placeholder="e.g. Java, Python, Go, TypeScript" required/>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={timedModeDefault} onChange={(e) => setTimedModeDefault(e.target.checked)} className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-0"/>
              <div>
                <span className="text-xs font-bold block">Enable Timed Mode by Default</span>
                <span className="text-[11px] text-on-surface-variant block">
                  Enforces 10-minute question time budgets in the Interview Arena.
                </span>
              </div>
            </label>

            <Button type="submit" variant="primary" disabled={saving} className="gap-2">
              <Save className="w-4 h-4"/>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </form>

      {/* Security Credentials Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-4 h-4 text-secondary"/>
          Security & Cryptographic Standards
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 text-xs space-y-1">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Password Hash</span>
            <span className="font-bold font-mono">Argon2id (RFC 9106)</span>
          </div>
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 text-xs space-y-1">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Session Protocol</span>
            <span className="font-bold font-mono">PyJWT Bearer Token</span>
          </div>
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 text-xs space-y-1">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant block">Tenant Isolation</span>
            <span className="font-bold font-mono">Scoped user_id Queries</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-surface-container-lowest border border-error/40 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-error flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error"/>
              Danger Zone
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Irreversible account erasure. All mock interviews, answers, evaluations, and XP records will be permanently deleted from MongoDB.
            </p>
          </div>

          {deleteConfirm ? (<div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDeleteAccount} className="gap-1.5">
                <Trash2 className="w-3.5 h-3.5"/>
                {deleting ? 'Deleting...' : 'Confirm Wipe'}
              </Button>
            </div>) : (<Button variant="outline" size="sm" onClick={() => setDeleteConfirm(true)} className="text-error border-error/40 hover:bg-error-container/20">
              Delete Account
            </Button>)}
        </div>
      </div>
    </div>);
};
