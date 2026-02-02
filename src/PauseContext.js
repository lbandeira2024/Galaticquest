import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './PauseContext.css';

const channel = new BroadcastChannel('pause_channel');

const PauseContext = createContext();

// ================== INÍCIO DA ALTERAÇÃO (1/4) ==================
// O Provider agora aceita 'gameNumber', 'apiBaseUrl' e 'initialPauseState'
export const PauseProvider = ({ children, gameNumber, apiBaseUrl, initialPauseState }) => {
    // =================== FIM DA ALTERAÇÃO (1/4) ===================

    // ================== INÍCIO DA ALTERAÇÃO (2/4) ==================
    // Define o estado inicial de pausa com base no que veio do AppInitializer
    const [isPaused, setIsPaused] = useState(initialPauseState || false);
    // =================== FIM DA ALTERAÇÃO (2/4) ===================

    const [isModalVisible, setIsModalVisible] = useState(true);
    const tabId = useRef(Date.now().toString(36) + Math.random().toString(36).substring(2));

    // ================== INÍCIO DA ALTERAÇÃO (3/4) ==================
    // Se o estado inicial for 'pausado', define o controlador como 'ADMIN_PAUSE'
    const [pauseControllerId, setPauseControllerId] = useState(
        initialPauseState ? 'ADMIN_PAUSE' : null
    );
    // =================== FIM DA ALTERAÇÃO (3/4) ===================

    const pauseTimeRef = useRef(null);
    const elapsedTimeRef = useRef(0);

    // Efeito para BroadcastChannel (pausa entre abas na MESMA máquina)
    useEffect(() => {
        const handleMessage = (event) => {
            // Verifica se a mensagem tem os dados e se o gameNumber corresponde
            if (typeof event.data.isPaused === 'boolean' && event.data.gameNumber !== undefined) {

                // Só aplica a pausa se o gameNumber da mensagem for igual
                // ao gameNumber deste Provider (do jogador).
                if (event.data.gameNumber == gameNumber) {
                    setIsPaused(event.data.isPaused);
                    setPauseControllerId(event.data.controllerId);
                }
            }
        };
        channel.addEventListener('message', handleMessage);
        return () => {
            channel.removeEventListener('message', handleMessage);
        };
    }, [gameNumber]); // Depende apenas do gameNumber


    // ================== INÍCIO DA ALTERAÇÃO (4/4) ==================
    // NOVO: useEffect para Polling (Verificação de Status do Servidor)
    // Isso sincroniza com o DB e funciona entre computadores.
    useEffect(() => {

        const checkPauseStatus = async () => {
            // Só roda se tivermos a URL e um gameNumber.
            // Diferente da versão anterior, ele roda MESMO SE o jogador pausou,
            // para garantir que uma pausa de admin sobreponha a pausa do jogador.
            if (!gameNumber || !apiBaseUrl) {
                return;
            }

            try {
                const response = await fetch(`${apiBaseUrl}/games/${gameNumber}/pause-status`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar status de pausa');
                }

                const data = await response.json();
                const serverIsPaused = data.isPaused;

                // Sincroniza o estado local com o servidor
                if (serverIsPaused && !isPaused) {
                    // O servidor foi pausado (pelo admin), mas o jogo local não está.
                    // Força a pausa.
                    console.log("PAUSE (REMOTO): Recebido comando de pausa do servidor.");
                    setIsPaused(true);
                    setPauseControllerId('ADMIN_PAUSE'); // Trava o botão 'Continuar'
                }
                else if (!serverIsPaused && isPaused && pauseControllerId === 'ADMIN_PAUSE') {
                    // O servidor não está pausado, mas o jogo local está (por um admin).
                    // Força a retomada.
                    console.log("RESUME (REMOTO): Recebido comando de retomada do servidor.");
                    setIsPaused(false);
                    setPauseControllerId(null);
                }
                // Se serverIsPaused=true E isPaused=true E controller='ADMIN_PAUSE', não faz nada (já está correto).
                // Se serverIsPaused=false E isPaused=false, não faz nada (já está correto).
                // Se isPaused=true E controller=tabId.current (pausado pelo jogador), não faz nada (jogador no controle).

            } catch (error) {
                console.error("Erro no polling de pausa:", error);
            }
        };

        // Roda a verificação a cada 5 segundos (5000 ms)
        const intervalId = setInterval(checkPauseStatus, 5000);

        // Limpa o intervalo quando o componente for desmontado
        return () => clearInterval(intervalId);

    }, [gameNumber, apiBaseUrl, isPaused, pauseControllerId]); // Re-avalia o loop se o estado local mudar
    // =================== FIM DA ALTERAÇÃO (4/4) ===================


    useEffect(() => {
        if (isPaused) {
            document.body.style.overflow = 'hidden';
            pauseTimeRef.current = Date.now();
        } else {
            document.body.style.overflow = 'auto';
            if (pauseTimeRef.current) {
                elapsedTimeRef.current += Date.now() - pauseTimeRef.current;
            }
        }
    }, [isPaused]);

    // togglePause (Ação do JOGADOR)
    const togglePause = useCallback(() => {
        const isCurrentlyPaused = isPaused;

        // Impede o jogador de despausar um jogo pausado pelo admin
        if (isCurrentlyPaused && pauseControllerId && pauseControllerId !== tabId.current) {
            return;
        }

        const newPauseState = !isCurrentlyPaused;
        setIsPaused(newPauseState);

        // Se o jogador pausa, ele é o controlador. Se ele despausa, ninguém é.
        const newControllerId = newPauseState ? tabId.current : null;
        setPauseControllerId(newControllerId);

        // Envia para OUTRAS ABAS DESTE JOGADOR na mesma máquina
        channel.postMessage({
            gameNumber: gameNumber,
            isPaused: newPauseState,
            controllerId: newControllerId
        });
    }, [isPaused, pauseControllerId, gameNumber]);


    const pause = useCallback(() => { if (!isPaused) togglePause(); }, [isPaused, togglePause]);
    const resume = useCallback(() => { if (isPaused) togglePause(); }, [isPaused, togglePause]);
    const getElapsedTime = () => elapsedTimeRef.current;

    // O jogador só pode retomar se não houver controlador OU se ele for o controlador
    const canResume = !pauseControllerId || pauseControllerId === tabId.current;

    return (
        <PauseContext.Provider value={{
            isPaused,
            togglePause,
            pause,
            resume,
            getElapsedTime,
            setIsModalVisible
        }}>
            {children}
            {isPaused && isModalVisible && (
                <div className="pause-modal-overlay">
                    <div className="pause-modal">
                        <h1>PAUSA</h1>
                        <p>O jogo está pausado</p>
                        <button
                            onClick={togglePause}
                            className="resume-button"
                            disabled={!canResume} // Desabilitado se for 'ADMIN_PAUSE'
                        >
                            Continuar Jogo
                        </button>
                    </div>
                </div>
            )}
        </PauseContext.Provider>
    );
};

export const usePause = () => {
    const context = useContext(PauseContext);
    if (!context) {
        throw new Error('usePause must be used within a PauseProvider');
    }
    return context;
};