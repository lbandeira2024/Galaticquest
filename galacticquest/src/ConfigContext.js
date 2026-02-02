// src/ConfigContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/config.json') // O arquivo está na pasta public, então é a raiz do servidor
            .then(response => {
                if (!response.ok) {
                    throw new Error('Não foi possível carregar a configuração.');
                }
                return response.json();
            })
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Erro ao carregar config.json:", err);
                setError(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Carregando configuração...</div>;
    }

    if (error || !config) {
        return <div>Erro ao carregar a configuração da aplicação. Verifique o console.</div>;
    }

    const value = {
        frontendUrl: config.frontendUrl,
        apiBaseUrl: config.apiBaseUrl,
        serverPort: config.serverPort
    };

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    return useContext(ConfigContext);
};