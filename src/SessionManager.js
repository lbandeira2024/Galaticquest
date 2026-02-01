
// SessionManager.js - Utilitário para gerenciar sessão com expiração de 3 horas
export class SessionManager {
    static SESSION_KEY = 'userSession';
    static SPACE_COINS_KEY = 'spaceCoins';
    static SESSION_DURATION = 3 * 60 * 60 * 1000; // 3 horas em millisegundos

    // Verifica se a sessão está válida
    static isSessionValid() {
        const sessionData = sessionStorage.getItem(this.SESSION_KEY);
        if (!sessionData) return false;

        try {
            const parsed = JSON.parse(sessionData);
            return Date.now() < parsed.expiresAt;
        } catch {
            return false;
        }
    }

    // Cria uma nova sessão
    static createSession(user, spaceCoins, teamName) {
        const sessionData = {
            user: user,
            spaceCoins: spaceCoins || 1000001,
            teamName: teamName,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.SESSION_DURATION
        };

        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
        sessionStorage.setItem(this.SPACE_COINS_KEY, sessionData.spaceCoins.toString());
        return sessionData;
    }

    // Obtém dados da sessão
    static getSessionData() {
        if (!this.isSessionValid()) {
            return null;
        }

        try {
            const sessionData = sessionStorage.getItem(this.SESSION_KEY);
            return JSON.parse(sessionData);
        } catch {
            return null;
        }
    }

    // Atualiza dados da sessão
    static updateSession(updates) {
        const currentSession = this.getSessionData();
        if (!currentSession) return false;

        const updatedSession = {
            ...currentSession,
            ...updates,
            timestamp: Date.now() // Atualiza atividade
        };

        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
        if (updates.spaceCoins !== undefined) {
            sessionStorage.setItem(this.SPACE_COINS_KEY, updates.spaceCoins.toString());
        }

        return true;
    }

    // Renova a sessão por mais 3 horas
    static renewSession() {
        const currentSession = this.getSessionData();
        if (!currentSession) return false;

        currentSession.expiresAt = Date.now() + this.SESSION_DURATION;
        currentSession.timestamp = Date.now();

        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(currentSession));
        return true;
    }

    // Limpa a sessão
    static clearSession() {
        sessionStorage.removeItem(this.SESSION_KEY);
        sessionStorage.removeItem(this.SPACE_COINS_KEY);
    }

    // Obtém SpaceCoins da sessão (fallback para sessionStorage simples)
    static getSpaceCoins() {
        const sessionData = this.getSessionData();
        if (sessionData && sessionData.spaceCoins !== undefined) {
            return sessionData.spaceCoins;
        }

        // Fallback para o sessionStorage simples
        const simpleCoins = sessionStorage.getItem(this.SPACE_COINS_KEY);
        return simpleCoins ? parseInt(simpleCoins) : 1000001;
    }
}
