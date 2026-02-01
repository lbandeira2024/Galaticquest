import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Lê o objeto de usuário do localStorage ao iniciar
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = (userData) => {
        // Salva o objeto completo do usuário
        localStorage.setItem('user', JSON.stringify(userData));
        // Salva APENAS o ID para acesso rápido e fácil
        localStorage.setItem('userId', userData._id);
        setUser(userData);
    };

    const logout = () => {
        // Limpa tudo ao fazer logout
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        setUser(null);
    };

    // O value agora expõe o objeto de usuário completo, e as funções de login/logout
    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};