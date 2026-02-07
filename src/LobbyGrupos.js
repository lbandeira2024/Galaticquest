import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";
import "./LobbyGrupos.css";

// CORREÇÃO: Usar rota relativa para Proxy
const API_URL = "/api";

const LobbyGrupos = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Referências
    const canvasRef = useRef(null); // Para o fundo de estrelas
    const videoRef = useRef(null);  // Para o vídeo da câmera

    // Estados de Dados
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados de Movimentação de Membros
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    // Estados da Câmera / Foto
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isSavingPhoto, setIsSavingPhoto] = useState(false);

    // NOVO: Estado para controlar a exibição imediata do botão após salvar
    const [localPhotoConfirmed, setLocalPhotoConfirmed] = useState(false);

    // Efeito Visual de Estrelas (Background)
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

    // Função para buscar dados
    const fetchGroups = async () => {
        if (!user?.gameNumber) return;
        try {
            const response = await axios.get(`${API_URL}/games/${user.gameNumber}/groups-details`);
            if (response.data.success) {
                setGroups(response.data.groups);

                // Verifica se o meu grupo já tem foto salva no banco para atualizar o estado local
                const myGroup = response.data.groups.find(g => g._id === user?.grupo?._id);
                // Assume que o backend retorna a propriedade 'foto' ou 'photo' ou 'teamPhoto'
                if (myGroup && (myGroup.foto || myGroup.photo || myGroup.teamPhoto)) {
                    setLocalPhotoConfirmed(true);
                }
            }
        } catch (error) {
            console.error("Erro ao carregar grupos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Polling de dados
    useEffect(() => {
        fetchGroups();
        const interval = setInterval(fetchGroups, 2000);
        return () => clearInterval(interval);
    }, [user]);

    // --- FUNÇÕES DE LÓGICA DE GRUPO ---

    const handleToggleLock = async (groupId) => {
        try {
            const response = await axios.post(`${API_URL}/group/toggle-lock`, {
                userId: user._id,
                groupId: groupId
            });

            // Se a operação foi bem sucedida e o grupo agora está trancado, abre a câmera
            if (response.data.success) {
                fetchGroups(); // Atualiza a lista
                if (response.data.isLocked) {
                    // Pequeno delay para UX
                    setTimeout(() => startCamera(), 500);
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || "Erro ao alterar bloqueio.");
        }
    };

    const openMoveModal = (member, sourceGroup) => {
        if (sourceGroup.isLocked) return;
        setSelectedMember({ ...member, sourceGroupId: sourceGroup._id });
        setMoveModalOpen(true);
    };

    const handleMoveMember = async (targetGroupId) => {
        if (!selectedMember) return;
        try {
            const response = await axios.post(`${API_URL}/group/move-member`, {
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

    // --- FUNÇÕES DA CÂMERA ---

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            setShowPhotoModal(true);
            setCapturedImage(null);

            // Aguarda o render do modal para anexar o stream ao vídeo
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 100);
        } catch (err) {
            alert("Não foi possível acessar a câmera. Verifique as permissões.");
            console.error(err);
        }
    };

    const takePhoto = () => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext("2d");
        // Espelhar a imagem horizontalmente para ficar mais natural (opcional)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);

        const imageSrc = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageSrc);
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        // O stream ainda deve estar ativo, apenas reatribuir ao videoRef se necessário
        setTimeout(() => {
            if (videoRef.current && stream) {
                videoRef.current.srcObject = stream;
            }
        }, 100);
    };

    const savePhotoAndClose = async () => {
        if (!capturedImage) return;
        setIsSavingPhoto(true);

        try {
            await axios.post(`${API_URL}/group/save-photo`, {
                gameNumber: user.gameNumber,
                teamName: user.grupo.teamName,
                image: capturedImage
            });

            // IMPORTANTE: Atualiza o estado local para mostrar o botão imediatamente
            setLocalPhotoConfirmed(true);

            // Atualiza os dados do servidor para persistência
            await fetchGroups();

            closeCamera();
            // Feedback opcional ou apenas fecha silenciosamente para mostrar o botão do Hangar
            // alert("Foto da equipe registrada com sucesso!"); 
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar a foto. Tente novamente.");
        } finally {
            setIsSavingPhoto(false);
        }
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setShowPhotoModal(false);
        setCapturedImage(null);
    };

    const handleContinue = () => {
        navigate("/SelecaoNave");
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    // Identifica o grupo atual do usuário e status
    const userGroup = groups.find(g => g._id === user?.grupo?._id);

    // Lógica para liberar o botão: Grupo Trancado AND (Foto salva localmente OU Foto vinda do banco)
    const canProceedToHangar = userGroup?.isLocked && (localPhotoConfirmed || userGroup?.foto || userGroup?.photo || userGroup?.teamPhoto);

    return (
        <div className="background">
            <canvas ref={canvasRef} className="stars"></canvas>

            <div className="lobby-container-visual">
                {/* CABEÇALHO */}
                <div className="logo-section">
                    <img src="/images/clientes/santander.png" alt="Santander Logo" className="logo-image logo-client" />
                    <div className="title-container">
                        <h2>Missão Interestelar ACEE</h2>
                    </div>
                    <img src="/images/ACEE.png" alt="ACEE Logo" className="logo-image logo-acee" />
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
                        <div className="groups-grid">
                            {groups.map((group) => {
                                const isMyGroup = user?.grupo?._id === group._id;
                                const isLocked = group.isLocked;

                                return (
                                    <div key={group._id} className={`group-card-visual ${isMyGroup ? 'my-group-visual' : ''} ${isLocked ? 'locked-group' : ''}`}>
                                        <div className="group-header-visual">
                                            <div className="header-info">
                                                <h3>{group.teamName}</h3>

                                                {/* Botão de Lock */}
                                                <button
                                                    className={`lock-btn ${isLocked ? 'closed' : 'open'} ${!isMyGroup ? 'disabled-lock' : ''}`}
                                                    onClick={() => isMyGroup && handleToggleLock(group._id)}
                                                    disabled={!isMyGroup}
                                                    title={isMyGroup ? "Clique para Trancar/Destrancar" : "Apenas membros podem trancar este grupo"}
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
                                                            title="Mover tripulante"
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
                    )}

                    <div className="lobby-footer-section">
                        {/* Botão extra para abrir câmera manualmente se já estiver trancado, mas sem foto (ou se quiser refazer) */}
                        {userGroup?.isLocked && (
                            <button onClick={startCamera} className="submit-button photo-btn-extra" style={{ marginRight: '15px', background: canProceedToHangar ? '#555' : '#e91e63' }}>
                                {canProceedToHangar ? "📸 Refazer Foto" : "📸 Registrar Foto Obrigatória"}
                            </button>
                        )}

                        {/* O botão só aparece se estiver trancado E com foto confirmada */}
                        {canProceedToHangar && (
                            <button onClick={handleContinue} className="submit-button lobby-btn">
                                Prosseguir para Hangar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL DE TRANSFERÊNCIA DE MEMBRO */}
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
                                    {g.teamName}
                                    {g.isLocked && <span className="lock-icon-small">🔒</span>}
                                </button>
                            ))}
                            {groups.length <= 1 && <p className="no-targets">Nenhum outro grupo disponível.</p>}
                        </div>
                        <button className="cancel-move-btn" onClick={() => setMoveModalOpen(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* MODAL DA CÂMERA / FOTO */}
            {showPhotoModal && (
                <div className="photo-modal-overlay">
                    <div className="photo-modal-content">
                        <h3>Registro Oficial da Equipe</h3>
                        <p>Parabéns! O grupo está formado. Sorriam para o registro!</p>

                        <div className="camera-box">
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captura da equipe" className="camera-feed" />
                            ) : (
                                <video ref={videoRef} autoPlay playsInline className="camera-feed" style={{ transform: 'scaleX(-1)' }} />
                            )}
                        </div>

                        <div className="photo-actions">
                            {!capturedImage ? (
                                <button onClick={takePhoto} className="submit-button capture-btn">
                                    🔘 CAPTURAR
                                </button>
                            ) : (
                                <>
                                    <button onClick={savePhotoAndClose} className="submit-button save-btn" disabled={isSavingPhoto}>
                                        {isSavingPhoto ? "Salvando..." : "✅ CONFIRMAR E SALVAR"}
                                    </button>
                                    <button onClick={retakePhoto} className="submit-button retake-btn" disabled={isSavingPhoto}>
                                        🔄 Tirar Outra
                                    </button>
                                </>
                            )}
                            <button onClick={closeCamera} className="cancel-move-btn" disabled={isSavingPhoto}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LobbyGrupos;