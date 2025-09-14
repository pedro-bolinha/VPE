// Utilitário de autenticação para o frontend
class AuthManager {
    constructor() {
        this.TOKEN_KEY = 'vpe_token';
        this.USER_KEY = 'vpe_user';
        this.LOGIN_TIME_KEY = 'vpe_login_time';
    }

    // Salvar token e dados do usuário
    saveAuth(token, user) {
        try {
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            localStorage.setItem(this.LOGIN_TIME_KEY, new Date().toISOString());
            console.log(' Autenticação salva:', user.email);
        } catch (error) {
            console.error(' Erro ao salvar autenticação:', error);
        }
    }

    // Obter token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Obter dados do usuário
    getUser() {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error(' Erro ao recuperar dados do usuário:', error);
            return null;
        }
    }

    // Verificar se está logado
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    }

    // Verificar se é admin
    isAdmin() {
        const user = this.getUser();
        return user && user.tipoUsuario === 'admin';
    }

    // Limpar dados de autenticação (logout)
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.LOGIN_TIME_KEY);
        console.log(' Logout realizado');
    }

    // Fazer requisição autenticada
    async authenticatedFetch(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('Token não encontrado. Faça login novamente.');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Se token expirou, fazer logout automaticamente
        if (response.status === 401 || response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.message && errorData.message.includes('Token')) {
                console.warn(' Token expirado, fazendo logout automático...');
                this.logout();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
        }

        return response;
    }

    // Verificar validade do token no servidor
    async verifyToken() {
        try {
            const response = await this.authenticatedFetch('/api/verify-token');
            const result = await response.json();
            
            if (response.ok && result.success) {
                console.log(' Token válido');
                return true;
            } else {
                console.warn(' Token inválido');
                this.clearAuth();
                return false;
            }
        } catch (error) {
            console.error(' Erro ao verificar token:', error);
            this.clearAuth();
            return false;
        }
    }

    // Renovar token
    async refreshToken() {
        try {
            const response = await this.authenticatedFetch('/api/refresh-token', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                localStorage.setItem(this.TOKEN_KEY, result.token);
                console.log(' Token renovado');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(' Erro ao renovar token:', error);
            return false;
        }
    }

    // Fazer login
    async login(email, senha) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.saveAuth(result.token, result.usuario);
                return { success: true, user: result.usuario };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error(' Erro no login:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Fazer logout
    async logout() {
        try {
            // Notificar o servidor (opcional)
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                }
            }).catch(() => {}); // Ignora erros pois já vamos limpar localmente

            this.clearAuth();
            
            // Redirecionar para login
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.location.href = '/';
            }
        } catch (error) {
            console.error(' Erro no logout:', error);
            this.clearAuth();
        }
    }

    // Registrar novo usuário
    async register(userData) {
        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.saveAuth(result.token, result.usuario);
                return { success: true, user: result.usuario };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error(' Erro no registro:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Verificar se precisa redirecionar para login
    requireAuth() {
        if (!this.isAuthenticated()) {
            console.warn(' Acesso negado: usuário não autenticado');
            window.location.href = '/';
            return false;
        }
        return true;
    }

    // Verificar se precisa ser admin
    requireAdmin() {
        if (!this.requireAuth()) return false;
        
        if (!this.isAdmin()) {
            console.warn(' Acesso negado: permissão de administrador necessária');
            alert('Acesso negado. Você não tem permissão de administrador.');
            window.history.back();
            return false;
        }
        return true;
    }

    // Inicializar verificações automáticas
    init() {
        // Verificar token ao carregar página
        if (this.isAuthenticated()) {
            this.verifyToken().catch(console.error);
        }

        // Verificar token periodicamente (a cada 30 minutos)
        setInterval(() => {
            if (this.isAuthenticated()) {
                this.verifyToken().catch(console.error);
            }
        }, 30 * 60 * 1000);
    }

    // Obter informações do usuário logado
    getCurrentUser() {
        return this.getUser();
    }

    // Verificar tempo de login
    getLoginAge() {
        const loginTime = localStorage.getItem(this.LOGIN_TIME_KEY);
        if (!loginTime) return null;
        
        const loginDate = new Date(loginTime);
        const now = new Date();
        return Math.floor((now - loginDate) / (1000 * 60 * 60)); // horas
    }

    // Auto logout após 24 horas
    checkAutoLogout() {
        const age = this.getLoginAge();
        if (age && age >= 24) {
            console.warn(' Sessão expirada por tempo (24h)');
            this.logout();
            return true;
        }
        return false;
    }
}

// Instância global do gerenciador de autenticação
const auth = new AuthManager();

// Inicializar quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    auth.init();
    auth.checkAutoLogout();
});

// Exportar para uso global
window.auth = auth;