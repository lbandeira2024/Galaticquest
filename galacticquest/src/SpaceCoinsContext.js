import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';

const SpaceCoinsContext = createContext();

export const SpaceCoinsProvider = ({ children }) => {
    const { user } = useAuth();
    const { apiBaseUrl } = useConfig();

    const [spaceCoins, setSpaceCoinsInternal] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Controle para saber se devemos salvar no banco ou apenas atualizar visualmente
    const shouldSaveRef = useRef(false);
    const isInitialLoad = useRef(true);

    const isSessionValid = () => {
        const sessionData = sessionStorage.getItem('userSession');
        if (!sessionData) return false;
        try {
            const parsed = JSON.parse(sessionData);
            return Date.now() < parsed.expiresAt;
        } catch {
            return false;
        }
    };

    const updateServerSpaceCoins = useCallback(async (newValue) => {
        if (user?._id && apiBaseUrl) {
            try {
                if (newValue === null) return false;

                console.log("🔄 [SpaceCoinsContext] Atualizando no servidor:", newValue);
                const response = await fetch(`${apiBaseUrl}/${user._id}/update-gamedata`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spaceCoins: newValue })
                });
                const data = await response.json();
                if (!response.ok || !data.success) {
                    console.error("❌ Erro ao salvar Space Coins:", data.message);
                    return false;
                }
                console.log("✅ [SpaceCoinsContext] Salvo no servidor.");
                return true;
            } catch (error) {
                console.error("❌ Erro de rede ao salvar Space Coins:", error);
                return false;
            }
        }
        return false;
    }, [user?._id, apiBaseUrl]);

    // Função 1: Ação do Usuário (Gastar/Receber) -> Atualiza e SALVA no banco
    const setSpaceCoinsPersistent = useCallback((newValueOrUpdater) => {
        shouldSaveRef.current = true; // Ativa flag de salvamento
        setSpaceCoinsInternal(newValueOrUpdater);
    }, []);

    // Função 2: Sincronização (Ler do Banco) -> Atualiza visual mas NÃO SALVA no banco
    const syncSpaceCoins = useCallback((newValue) => {
        if (newValue !== undefined && newValue !== null) {
            shouldSaveRef.current = false; // Desativa flag de salvamento
            setSpaceCoinsInternal(newValue);
        }
    }, []);

    // --- CORREÇÃO DO CONFLITO DE SINCRONIA ---
    useEffect(() => {
        // Se shouldSaveRef for true, significa que acabamos de atualizar o saldo localmente
        // e estamos aguardando o server. NÃO devemos sobrescrever com o valor 'velho' do user.grupo.
        if (shouldSaveRef.current) return;

        if (user?.grupo?.spaceCoins !== undefined) {
            // Só sincroniza se o valor do userContext for diferente do atual
            // E removemos 'spaceCoins' do array de dependências para evitar loops
            if (spaceCoins !== null && user.grupo.spaceCoins !== spaceCoins) {
                console.log("🔄 [Auto-Sync] Detectada mudança no UserContext. Sincronizando SpaceCoins...");
                syncSpaceCoins(user.grupo.spaceCoins);
            }
        }
        // REMOVIDO 'spaceCoins' DAQUI EMBAIXO:
    }, [user?.grupo?.spaceCoins, syncSpaceCoins]);
    // -----------------------------------------------------------

    // Effect que reage a mudanças e decide se salva ou não
    useEffect(() => {
        if (spaceCoins === null) return;

        // Atualiza SessionStorage sempre
        try {
            const currentSession = sessionStorage.getItem('userSession');
            if (currentSession && isSessionValid()) {
                const parsed = JSON.parse(currentSession);
                parsed.spaceCoins = spaceCoins;
                parsed.timestamp = Date.now();
                sessionStorage.setItem('userSession', JSON.stringify(parsed));
            }
            sessionStorage.setItem('spaceCoins', (spaceCoins || 0).toString());
        } catch (e) { }

        // Lógica de Salvamento no Servidor
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        // SÓ SALVA SE A FLAG shouldSaveRef ESTIVER TRUE
        if (shouldSaveRef.current) {
            updateServerSpaceCoins(spaceCoins);
        }

    }, [spaceCoins, updateServerSpaceCoins]);


    // Carregamento Inicial (Mount)
    useEffect(() => {
        const loadSpaceCoins = async () => {
            if (user?._id && apiBaseUrl) {
                try {
                    setIsLoading(true);
                    shouldSaveRef.current = false;

                    const response = await fetch(`${apiBaseUrl}/${user._id}/game-data`);
                    const data = await response.json();

                    if (data.success && data.spaceCoins !== undefined) {
                        setSpaceCoinsInternal(data.spaceCoins);
                        // Atualiza sessão
                        try {
                            const sessionUpdate = {
                                user: user,
                                spaceCoins: data.spaceCoins,
                                teamName: user.teamName,
                                timestamp: Date.now(),
                                expiresAt: Date.now() + (3 * 60 * 60 * 1000)
                            };
                            sessionStorage.setItem('userSession', JSON.stringify(sessionUpdate));
                            sessionStorage.setItem('spaceCoins', data.spaceCoins.toString());
                        } catch (e) { }
                    } else {
                        setSpaceCoinsInternal(0);
                    }
                } catch (error) {
                    console.error("❌ Erro ao carregar Space Coins:", error);
                    setSpaceCoinsInternal(0);
                } finally {
                    setIsLoading(false);
                }
            } else if (!apiBaseUrl) {
                setIsLoading(true);
            } else {
                setSpaceCoinsInternal(0);
                setIsLoading(false);
            }
        };
        loadSpaceCoins();
    }, [user?._id, apiBaseUrl]);

    return (
        <SpaceCoinsContext.Provider value={{
            spaceCoins,
            setSpaceCoins: setSpaceCoinsPersistent, // Use para ações do usuário (Salva)
            syncSpaceCoins, // Use para atualizar com dados vindos do servidor (Não Salva)
            isLoading
        }}>
            {children}
        </SpaceCoinsContext.Provider>
    );
};

export const useSpaceCoins = () => {
    const context = useContext(SpaceCoinsContext);
    if (!context) throw new Error('useSpaceCoins must be used within a SpaceCoinsProvider');
    return context;
};