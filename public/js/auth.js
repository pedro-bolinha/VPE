// Sistema de Autenticação Simplificado para VPE
class AuthManager {
    constructor() {
        this.TOKEN_KEY = 'vpe_token';
        this.USER_KEY = 'vpe_user';
        this.LOGIN_TIME_KEY = 'vpe_login_time';
    }

    // Salvar autenticação
    saveAuth(token, user) {
        try {
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            localStorage.setItem(this.LOGIN_TIME_KEY, Date.now().toString());
            console.log(' Auth saved:', user.email);
        } catch (error) {
            console.error(' Error saving auth:', error);
        }
    }

    // Obter token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Obter usuário
    getUser() {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error(' Error getting user:', error);
            return null;
        }
    }

    // Verificar se está logado
    isAuthenticated() {
        return !!(this.getToken() && this.getUser());
    }

    // Verificar se é admin
    isAdmin() {
        const user = this.getUser();
        return user?.tipoUsuario === 'admin';
    }

    // Limpar dados
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.LOGIN_TIME_KEY);
        console.log(' Logout completed');
    }

    // Requisição autenticada
    async authenticatedFetch(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('Token não encontrado');
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        // Auto logout em caso de token inválido
        if (response.status === 401 || response.status === 403) {
            this.logout();
            throw new Error('Sessão expirada');
        }

        return response;
    }

    // Login
    async login(email, senha) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.saveAuth(result.token, result.usuario);
                return { success: true, user: result.usuario };
            }
            
            return { success: false, message: result.message };
        } catch (error) {
            console.error(' Login error:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Registro
    async register(userData) {
        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.saveAuth(result.token, result.usuario);
                return { success: true, user: result.usuario };
            }
            
            return { success: false, message: result.message };
        } catch (error) {
            console.error(' Register error:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Logout
    async logout() {
        try {
            // Tentar notificar servidor
            if (this.getToken()) {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.getToken()}` }
                }).catch(() => {});
            }
        } finally {
            this.clearAuth();
            
            // Redirecionar se necessário
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.location.href = '/';
            }
        }
    }

    // Verificar se precisa estar logado
    requireAuth() {
        if (!this.isAuthenticated()) {
            console.warn(' Access denied: not authenticated');
            window.location.href = '/';
            return false;
        }
        return true;
    }

    // Verificar se precisa ser admin
    requireAdmin() {
        if (!this.requireAuth()) return false;
        
        if (!this.isAdmin()) {
            console.warn(' Access denied: admin required');
            alert('Acesso negado. Permissão de administrador necessária.');
            window.history.back();
            return false;
        }
        return true;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.getUser();
    }

    // Verificar idade do login (em horas)
    getLoginAge() {
        const loginTime = localStorage.getItem(this.LOGIN_TIME_KEY);
        if (!loginTime) return null;
        
        return Math.floor((Date.now() - parseInt(loginTime)) / (1000 * 60 * 60));
    }

    // Auto logout por tempo
    checkAutoLogout() {
        const age = this.getLoginAge();
        if (age && age >= 24) {
            console.warn(' Session expired (24h)');
            this.logout();
            return true;
        }
        return false;
    }

    // Verificar token no servidor
    async verifyToken() {
        try {
            const response = await this.authenticatedFetch('/api/verify-token');
            const result = await response.json();
            
            return response.ok && result.success;
        } catch (error) {
            console.error(' Token verification failed:', error);
            return false;
        }
    }

    // Inicializar sistema
    init() {
        // Verificar auto logout
        this.checkAutoLogout();

        // Verificar token periodicamente (30 minutos)
        if (this.isAuthenticated()) {
            setInterval(() => {
                this.verifyToken().catch(() => {});
            }, 30 * 60 * 1000);
        }
    }
}

// Instância global
const auth = new AuthManager();

// Auto inicializar
document.addEventListener('DOMContentLoaded', () => {
    auth.init();
});

// Exportar globalmente
window.auth = auth;