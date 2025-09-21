// Sistema de Autenticação VPE
const auth = {
    // Chaves para localStorage
    TOKEN_KEY: 'vpe_token',
    USER_KEY: 'vpe_user',
    
    // Configurações
    API_BASE: '',
    
    // Salvar dados de autenticação
    saveAuth(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        console.log(' Auth data saved');
    },
    
    // Obter token
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },
    
    // Obter usuário atual
    getCurrentUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // Verificar se está autenticado
    isAuthenticated() {
        return !!(this.getToken() && this.getCurrentUser());
    },
    
    // Fazer logout
    async logout() {
        try {
            // Tentar invalidar token no servidor
            const token = this.getToken();
            if (token) {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.warn(' Erro ao fazer logout no servidor:', error.message);
        } finally {
            // Limpar dados locais
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            
            console.log(' Logout realizado');
            window.location.href = '/index.html';
        }
    },
    
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
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.saveAuth(data.token, data.usuario);
                return { success: true, user: data.usuario };
            } else {
                throw new Error(data.message || 'Erro no login');
            }
        } catch (error) {
            console.error(' Login error:', error);
            return { success: false, message: error.message };
        }
    },
    
    // Registrar usuário
    async register(userData) {
        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.saveAuth(data.token, data.usuario);
                return { success: true, user: data.usuario };
            } else {
                throw new Error(data.message || 'Erro no registro');
            }
        } catch (error) {
            console.error(' Register error:', error);
            return { success: false, message: error.message };
        }
    },
    
    // Verificar token no servidor
    async verifyToken() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const response = await fetch('/api/verify-token', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    // Atualizar dados do usuário se necessário
                    this.saveAuth(token, data.user);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.warn(' Token verification failed:', error.message);
            return false;
        }
    },
    
    // Fazer requisição autenticada
    async authenticatedFetch(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('Token não encontrado');
        }
        
        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            
            // Se token expirado ou inválido
            if (response.status === 401 || response.status === 403) {
                console.warn(' Token expirado ou inválido');
                this.logout();
                throw new Error('Sessão expirada');
            }
            
            return response;
        } catch (error) {
            if (error.message === 'Sessão expirada') {
                throw error;
            }
            console.error(' Authenticated fetch error:', error);
            throw new Error('Erro na requisição autenticada');
        }
    },
    
    // Exigir autenticação (redireciona se não autenticado)
    requireAuth() {
        if (!this.isAuthenticated()) {
            console.log(' Autenticação necessária, redirecionando...');
            window.location.href = '/index.html';
            return false;
        }
        return true;
    },
    
    // Verificar se usuário é admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.tipoUsuario === 'admin';
    },
    
    // Verificar se usuário pode adicionar empresas
    canAddCompany() {
        const user = this.getCurrentUser();
        return user && ['admin', 'empresa', 'investidor'].includes(user.tipoUsuario);
    },
    
    // Atualizar token automaticamente
    async refreshToken() {
        try {
            const response = await this.authenticatedFetch('/api/refresh-token', {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.token) {
                    const currentUser = this.getCurrentUser();
                    this.saveAuth(data.token, currentUser);
                    console.log(' Token atualizado');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.warn(' Erro ao atualizar token:', error.message);
            return false;
        }
    }
};

// Verificação automática de token ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    if (auth.isAuthenticated()) {
        // Verificar se token ainda é válido
        const isValid = await auth.verifyToken();
        if (!isValid) {
            console.warn(' Token inválido detectado');
            auth.logout();
        }
    }
});

// Auto-refresh do token a cada 30 minutos
setInterval(async () => {
    if (auth.isAuthenticated()) {
        await auth.refreshToken();
    }
}, 30 * 60 * 1000);

console.log(' Auth system loaded');