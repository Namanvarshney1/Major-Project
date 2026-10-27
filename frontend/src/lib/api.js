const API_BASE_URL = '/api/v1';
class ApiClient {
    getToken() {
        return localStorage.getItem('preppulse_token');
    }
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
        if (!response.ok) {
            let errorMessage = `Request failed (${response.status})`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
                }
            }
            catch {
                // Fallback to status text
            }
            throw new Error(errorMessage);
        }
        return response.json();
    }
    // Auth Endpoints
    auth = {
        register: (data) => this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        login: (data) => this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getProfile: () => this.request('/auth/me'),
        updateProfile: (data) => this.request('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        deleteAccount: () => this.request('/auth/me', {
            method: 'DELETE',
        }),
    };
    // Interview Endpoints
    interviews = {
        create: (data) => this.request('/interviews/', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getActive: () => this.request('/interviews/active'),
        getById: (id) => this.request(`/interviews/${id}`),
        skip: (id) => this.request(`/interviews/${id}/skip`, {
            method: 'POST',
        }),
        end: (id) => this.request(`/interviews/${id}/end`, {
            method: 'POST',
        }),
        submitAnswer: (interviewId, questionId, answerText, timeSpentSeconds = 0) => this.request(`/interviews/${interviewId}/questions/${questionId}/answer`, {
            method: 'POST',
            body: JSON.stringify({
                answer_text: answerText,
                time_spent_seconds: timeSpentSeconds,
            }),
        }),
        getEvaluation: (interviewId, questionId) => this.request(`/interviews/${interviewId}/questions/${questionId}/evaluation`),
        getReport: (interviewId) => this.request(`/interviews/${interviewId}/report`),
    };
    // Dashboard Endpoints
    dashboard = {
        getMetrics: () => this.request('/dashboard/'),
    };
    // AI Coach Endpoints
    coach = {
        getRecommendation: () => this.request('/coach/'),
    };
    // Analytics & DNA Endpoints
    analytics = {
        getDna: () => this.request('/analytics/dna'),
        getSkillTree: () => this.request('/analytics/skill-tree'),
    };
    // Gamification Endpoints
    gamification = {
        getAchievements: () => this.request('/gamification/achievements'),
    };
    // History Endpoints
    history = {
        list: (params = {}) => {
            const search = new URLSearchParams();
            if (params.status)
                search.append('status', params.status);
            if (params.difficulty)
                search.append('difficulty', params.difficulty);
            if (params.role)
                search.append('role', params.role);
            if (params.limit)
                search.append('limit', String(params.limit));
            if (params.skip)
                search.append('skip', String(params.skip));
            const qs = search.toString();
            return this.request(`/history/${qs ? `?${qs}` : ''}`);
        },
    };
}
export const api = new ApiClient();
