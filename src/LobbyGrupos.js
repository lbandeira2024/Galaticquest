import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useConfig } from "./ConfigContext";
import axios from "axios";
import "./LobbyGrupos.css";

const LobbyGrupos = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { apiBaseUrl } = useConfig();

    // Referências
    const canvasRef = useRef(null);
    const videoRef = useRef(null);

    // Estados
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(""); // Estado para mensagens de erro/aviso

    // Estados de Movimentação e Câmera
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isSavingPhoto, setIsSavingPhoto] = useState(false);
    const [localPhotoConfirmed, setLocalPhotoConfirmed] = useState(false);

    // Efeito Visual de Estrelas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const stars = Array.from({ length: 150 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.3 + 0.1,
        }));

        let animationFrameId;
        const animateStars = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            stars.forEach((star) => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
                star.y += star.speed;
                if (star.y > window.innerHeight) {
                    star.y = 0;
                    star.x = Math.random() * window.innerWidth;
                }
            });
            animationFrameId = requestAnimationFrame(animateStars);
        };

        const handleResize = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        animateStars();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Função Principal de Busca
    const fetchGroups = async () => {
        // Validação inicial para evitar chamada sem dados
        if (!apiBaseUrl) return;
        if (!user) {
            console.warn("Usuário não encontrado no contexto.");
            return;
        }

        try {
            // Se o usuário não tiver gameNumber, usamos "1" como fallback ou tentamos buscar sem filtro específico na URL
            const gameNum = user.gameNumber || 1;

            console.log(`Buscando grupos para Game: ${gameNum} na URL: ${apiBaseUrl}`);

            const response = await axios.get(`${apiBaseUrl}/games/${gameNum}/groups-details`);

            if (response.data.success) {
                let fetchedGroups = response.data.groups;

                // FILTRO: Se o usuário tiver gameNumber definido, filtramos rigorosamente.
                // Se não, mostramos o que veio da API (fallback).
                if (user.gameNumber) {
                    fetchedGroups = fetchedGroups.filter(g =>
                        // Compara convertendo para número para evitar erros de string "1" vs número 1
                        Number(g.gameNumber) === Number(user.gameNumber)
                    );
                }

                if (fetchedGroups.length === 0) {
                    setErrorMsg(`Nenhum grupo encontrado para o Game ${user.gameNumber || 'Atual'}.`);
                } else {
                    setErrorMsg(""); // Limpa erro se achou grupos
                }

                setGroups(fetchedGroups);

                // Verifica foto do meu grupo
                const myGroup = fetchedGroups.find(g => g._id === user?.grupo?._id);
                if (myGroup && (myGroup.foto || myGroup.photo || myGroup.teamPhoto)) {
                    setLocalPhotoConfirmed(true);
                }
            } else {
                setErrorMsg("A API retornou sucesso: false.");
            }
        } catch (error) {
            console.error("Erro ao carregar grupos:", error);
            setErrorMsg("Erro de conexão ao buscar grupos.");
        } finally {
            setLoading(false);
        }
    };

    // Polling
    useEffect(() => {
        fetchGroups();
        const interval = setInterval(fetchGroups, 3000); // Aumentado para 3s para aliviar rede
        return () => clearInterval(interval);
    }, [user, apiBaseUrl]);

    // Lógica de Bloqueio
    const handleToggleLock = async (groupId) => {
        if (!apiBaseUrl) return;
        try {
            const response = await axios.post(`${apiBaseUrl}/group/toggle-lock`, {
                userId: user._id,
                groupId: groupId
            });
            if (response.data.success) {
                fetchGroups();
                if (response.data.isLocked) {
                    setTimeout(() => startCamera(), 500);
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || "Erro ao alterar bloqueio.");
        }
    };

    // Lógica de Movimento
    const openMoveModal = (member, sourceGroup) => {
        if (sourceGroup.isLocked) return;
        setSelectedMember({ ...member, sourceGroupId: sourceGroup._id });
        setMoveModalOpen(true);
    };

    const handleMoveMember = async (targetGroupId) => {
        if (!selectedMember || !apiBaseUrl) return;
        try {
            const response = await axios.post(`${apiBaseUrl}/group/move-member`, {
                memberId: selectedMember._id,
                targetGroupId: targetGroupId
            });
            if (response.data.success) {
                setMoveModalOpen(false);
                setSelectedMember(null);
                fetchGroups();
            }
        } catch (error) {
            alert(error.response?.data?.message || "Erro ao mover membro.");
        }
    };

    // Lógica da Câmera
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setShowPhotoModal(true);
            setCapturedImage(null);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 100);
        } catch (err) {
            alert("Não foi possível acessar a câmera. Verifique as permissões.");
        }
    };

    const takePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        setCapturedImage(canvas.toDataURL("image/jpeg"));
    };

    const savePhotoAndClose = async () => {
        if (!capturedImage || !apiBaseUrl) return;
        setIsSavingPhoto(true);
        try {
            // Verifica gameNumber antes de salvar
            const gameNum = user.gameNumber || 1;
            await axios.post(`${apiBaseUrl}/group/save-photo`, {
                gameNumber: gameNum,
                teamName: user.grupo.teamName,
                image: capturedImage
            });
            setLocalPhotoConfirmed(true);
            await fetchGroups();
            closeCamera();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar a foto.");
        } finally {
            setIsSavingPhoto(false);
        }
    };

    const closeCamera = () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(null);
        setShowPhotoModal(false);
        setCapturedImage(null);
    };

    // Utilitários
    const handleContinue = () => navigate("/SelecaoNave");
    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : "?";

    const userGroup = groups.find(g => g._id === user?.grupo?._id);
    const canProceedToHangar = userGroup?.isLocked && (localPhotoConfirmed || userGroup?.foto || userGroup?.photo || userGroup?.teamPhoto);

    return (
        <div className="lobby-background">
            <canvas ref={canvasRef} className="lobby-stars"></canvas>

            <div className="lobby-container-visual">
                <div className="logo-section">
                    <img src="/images/clientes/santander.png" alt="Logo Cliente" className="logo-image logo-client" />
                    <div className="title-container">
                        <h2>Missão Interestelar ACEE</h2>
                    </div>
                    <img src="/images/ACEE.png" alt="Logo ACEE" className="logo-image logo-acee" />
                </div>

                <div className="lobby-content-area">
                    <h2 className="lobby-subtitle">Organização Tática</h2>
                    <p className="lobby-description">
                        {canProceedToHangar
                            ? "Equipe pronta! Autorização para o Hangar concedida."
                            : "Ajuste os esquadrões. Tranque o grupo e registre a equipe para prosseguir."}
                    </p>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Carregando dados da frota...</p>
                        </div>
                    ) : (
                        <>
                            {/* Mensagem de Aviso se a lista estiver vazia */}
                            {groups.length === 0 && (
                                <div style={{ textAlign: "center", marginTop: "50px", color: "#ff4444" }}>
                                    <h3>{errorMsg || "Nenhum grupo encontrado."}</h3>
                                    <p>Verifique se o seu usuário possui um Game Number válido.</p>
                                </div>
                            )}

                            <div className="groups-grid">
                                {groups.map((group) => {
                                    const isMyGroup = user?.grupo?._id === group._id;
                                    const isLocked = group.isLocked;

                                    return (
                                        <div key={group._id} className={`group-card-visual ${isMyGroup ? 'my-group-visual' : ''} ${isLocked ? 'locked-group' : ''}`}>
                                            <div className="group-header-visual">
                                                <div className="header-info">
                                                    <h3>{group.teamName}</h3>
                                                    <button
                                                        className={`lock-btn ${isLocked ? 'closed' : 'open'} ${!isMyGroup ? 'disabled-lock' : ''}`}
                                                        onClick={() => isMyGroup && handleToggleLock(group._id)}
                                                        disabled={!isMyGroup}
                                                    >
                                                        {isLocked ? "🔒 Trancado" : "🔓 Aberto"}
                                                    </button>
                                                </div>
                                                <span className="member-badge">{group.membros.length} Trip.</span>
                                            </div>

                                            <div className="members-list-visual">
                                                {group.membros.map((member) => (
                                                    <div key={member._id} className="member-row">
                                                        <div className="avatar-circle">{getInitials(member.nome)}</div>
                                                        <div className="member-details">
                                                            <span className="name-text">
                                                                {member.nome} {user?._id === member._id && <span className="you-tag">(Você)</span>}
                                                            </span>
                                                            <span className="role-text">{member.cargo}</span>
                                                        </div>
                                                        {!isLocked && (
                                                            <button
                                                                className="move-icon-btn"
                                                                onClick={() => openMoveModal(member, group)}
                                                            >
                                                                ⇄
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <div className="lobby-footer-section">
                        {userGroup?.isLocked && (
                            <button onClick={startCamera} className="submit-button photo-btn-extra" style={{ marginRight: '15px', background: canProceedToHangar ? '#555' : '#e91e63' }}>
                                {canProceedToHangar ? "📸 Refazer Foto" : "📸 Registrar Foto Obrigatória"}
                            </button>
                        )}
                        {canProceedToHangar && (
                            <button onClick={handleContinue} className="submit-button lobby-btn">
                                Prosseguir para Hangar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL MOVER */}
            {moveModalOpen && selectedMember && (
                <div className="modal-overlay-move">
                    <div className="modal-move-content">
                        <h3>Transferir Tripulante</h3>
                        <p className="move-info">Mover <strong>{selectedMember.nome}</strong> para:</p>
                        <div className="target-list">
                            {groups.filter(g => g._id !== selectedMember.sourceGroupId).map(g => (
                                <button
                                    key={g._id}
                                    className={`target-btn ${g.isLocked ? 'locked-target' : ''}`}
                                    onClick={() => !g.isLocked && handleMoveMember(g._id)}
                                    disabled={g.isLocked}
                                >
                                    {g.teamName} {g.isLocked && "🔒"}
                                </button>
                            ))}
                        </div>
                        <button className="cancel-move-btn" onClick={() => setMoveModalOpen(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* MODAL FOTO */}
            {showPhotoModal && (
                <div className="photo-modal-overlay">
                    <div className="photo-modal-content">
                        <h3>Registro Oficial</h3>
                        <div className="camera-box">
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captura" className="camera-feed" />
                            ) : (
                                <video ref={videoRef} autoPlay playsInline className="camera-feed" style={{ transform: 'scaleX(-1)' }} />
                            )}
                        </div>
                        <div className="photo-actions">
                            {!capturedImage ? (
                                <button onClick={takePhoto} className="submit-button capture-btn">Capturar</button>
                            ) : (
                                <>
                                    <button onClick={savePhotoAndClose} className="submit-button save-btn" disabled={isSavingPhoto}>
                                        {isSavingPhoto ? "Salvando..." : "Confirmar"}
                                    </button>
                                    <button onClick={() => setCapturedImage(null)} className="submit-button retake-btn" disabled={isSavingPhoto}>
                                        Tirar Outra
                                    </button>
                                </>
                            )}
                            <button onClick={closeCamera} className="cancel-move-btn" disabled={isSavingPhoto}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LobbyGrupos;