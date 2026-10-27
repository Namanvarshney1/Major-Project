import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search, ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
export const HistoryPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filters state
    const [statusFilter, setStatusFilter] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [roleSearch, setRoleSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 10;
    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.history.list({
                status: statusFilter || undefined,
                difficulty: difficultyFilter || undefined,
                role: roleSearch || undefined,
                limit,
                skip: (page - 1) * limit,
            });
            setSessions(res?.items || []);
            setTotal(res?.total || 0);
        }
        catch (err) {
            console.error('Failed to load history:', err);
            setError(err.message || 'Unable to retrieve interview session records.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchHistory();
    }, [page, statusFilter, difficultyFilter]);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchHistory();
    };
    const totalPages = Math.ceil(total / limit) || 1;
    return (<div className="space-y-8 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">
              Archival Audit Trail
            </span>
            <span className="text-xs text-outline-variant">•</span>
            <span className="font-mono text-[10px] text-on-surface-variant uppercase">
              {total} Total Sessions Recorded
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-secondary"/>
            Interview History
          </h1>
        </div>

        <Button variant="primary" onClick={() => navigate('/interview/setup')} className="gap-2">
          New Mock Session <ArrowRight className="w-4 h-4"/>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"/>
            <input type="text" placeholder="Search by role (e.g. Backend Engineer)..." value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-mono focus:outline-none focus:border-primary transition-colors"/>
          </div>

          <div className="sm:col-span-3">
            <select value={difficultyFilter} onChange={(e) => {
            setDifficultyFilter(e.target.value);
            setPage(1);
        }} className="w-full py-2 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-mono focus:outline-none focus:border-primary transition-colors">
              <option value="">All Difficulties</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select value={statusFilter} onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
        }} className="w-full py-2 px-3 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-mono focus:outline-none focus:border-primary transition-colors">
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <Button type="submit" variant="outline" size="sm" className="w-full h-full justify-center">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Sessions Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl overflow-hidden">
        {loading ? (<div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"/>
            <p className="font-mono text-xs uppercase text-on-surface-variant">Loading archives...</p>
          </div>) : error ? (<div className="p-8 text-center text-error text-xs font-mono">{error}</div>) : sessions.length === 0 ? (<div className="p-12 text-center space-y-3">
            <History className="w-8 h-8 text-on-surface-variant mx-auto mb-2 opacity-50"/>
            <h3 className="text-sm font-bold tracking-tight">No Interview Records Found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              No interview sessions matched your query. Launch your first practice mock to start building your audit trail.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/interview/setup')} className="mt-2">
              Start Practice Session
            </Button>
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50 text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                  <th className="py-3 px-5">Role & Level</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Questions</th>
                  <th className="py-3 px-5">Score</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {sessions.map((item) => {
                const isCompleted = item.status === 'completed';
                const isInProgress = item.status === 'in_progress';
                return (<tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-on-surface">{item.job_role}</div>
                        <div className="font-mono text-[10px] text-on-surface-variant uppercase">
                          {item.difficulty} Tier
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono capitalize">
                        {(item.interview_type || 'technical').replace('_', ' ')}
                      </td>

                      <td className="py-4 px-5 font-mono">
                        {item.current_question_index ?? 0} / {item.total_questions ?? 5}
                      </td>

                      <td className="py-4 px-5">
                        {item.final_score !== null && item.final_score !== undefined ? (<span className={`font-mono font-bold text-sm ${item.final_score >= 80
                            ? 'text-secondary font-black'
                            : item.final_score >= 60
                                ? 'text-on-surface'
                                : 'text-error'}`}>
                            {Math.round(item.final_score)}%
                          </span>) : (<span className="font-mono text-on-surface-variant">--</span>)}
                      </td>

                      <td className="py-4 px-5">
                        <Badge variant={isCompleted
                        ? 'secondary'
                        : isInProgress
                            ? 'outline'
                            : 'destructive'} className="font-mono text-[9px] uppercase font-bold">
                          {(item.status || 'in_progress').replace('_', ' ')}
                        </Badge>
                      </td>

                      <td className="py-4 px-5 font-mono text-[11px] text-on-surface-variant">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    }) : 'Recent'}
                      </td>

                      <td className="py-4 px-5 text-right">
                        {isCompleted ? (<Button variant="ghost" size="sm" onClick={() => navigate(`/interview/${item.id}/report`)} className="gap-1.5 text-xs font-semibold hover:bg-surface-container">
                            Report <ExternalLink className="w-3 h-3"/>
                          </Button>) : isInProgress ? (<Button variant="primary" size="sm" onClick={() => navigate(`/interview/${item.id}`)} className="gap-1.5 text-xs font-semibold">
                            Resume <ArrowRight className="w-3 h-3"/>
                          </Button>) : (<span className="text-[10px] font-mono text-on-surface-variant uppercase">
                            Archived
                          </span>)}
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}

        {/* Pagination Bar */}
        {total > limit && (<div className="p-4 border-t border-outline-variant/30 flex items-center justify-between text-xs font-mono">
            <span className="text-on-surface-variant">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="w-3.5 h-3.5"/> Previous
              </Button>
              <span className="px-2 font-bold">
                {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="w-3.5 h-3.5"/>
              </Button>
            </div>
          </div>)}
      </div>
    </div>);
};
