document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Sistema de Fundo Animado (Estrelas Cyberpunk) ---
    const initCosmicBackground = () => {
        const canvas = document.getElementById('spaceCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Cria array de estrelas para o background
        const stars = Array.from({ length: 200 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.3 + 0.1,
        }));

        const animateStars = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Cor das estrelas

            stars.forEach((star) => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
                star.y += star.speed;

                // Reseta a estrela ao sair da tela no eixo Y
                if (star.y > window.innerHeight) {
                    star.y = 0;
                    star.x = Math.random() * window.innerWidth;
                }
            });
            animationFrameId = requestAnimationFrame(animateStars);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Configura tamanho inicial
        animateStars(); // Inicia loop
    };

    // --- 2. Lógica de Interação da Interface ---
    const initUIInteractions = () => {

        // A. Menu Lateral Esquerdo (Ações Rápidas)
        const actionTabs = document.querySelectorAll('.action-tab-btn');
        actionTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove a classe ativa de todos
                actionTabs.forEach(t => t.classList.remove('active-neon'));
                // Adiciona ao clicado
                e.target.classList.add('active-neon');
                console.log(`[CyberUI] Aba selecionada: ${e.target.textContent}`);
            });
        });

        // B. Menu Lateral Direito (Navegação Global)
        const navItems = document.querySelectorAll('.nav-menu-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                navItems.forEach(i => i.classList.remove('active-nav'));
                e.target.classList.add('active-nav');
                console.log(`[CyberUI] Navegação para: ${e.target.textContent}`);
            });
        });

        // C. Tags de Biomas (Seleção Múltipla visual)
        const tags = document.querySelectorAll('.cyber-tag');
        tags.forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.target.classList.toggle('active');
            });
        });

        // D. Captura de Inputs e Sliders para Log
        const inputs = document.querySelectorAll('.terminal-dropdown, .terminal-input-num, .cyber-range, .cyber-switch input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                const label = e.target.closest('.form-row').querySelector('label').textContent;
                console.log(`[CyberUI] ${label} alterado para:`, value);
            });
        });

        // E. Botão Salvar Principal
        const saveBtn = document.querySelector('.primary-neon');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Adiciona um efeito de carregamento visual simples
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'SALVANDO...';
                saveBtn.style.opacity = '0.7';

                // Simula requisição assíncrona
                setTimeout(() => {
                    console.log("[CyberUI] Regras e Pontuações salvas com sucesso!");
                    saveBtn.textContent = 'SALVO!';
                    saveBtn.style.backgroundColor = 'var(--neon-cyan)';
                    saveBtn.style.boxShadow = '0 0 15px rgba(0, 188, 212, 0.8)';

                    // Restaura estado após 2 segundos
                    setTimeout(() => {
                        saveBtn.textContent = originalText;
                        saveBtn.style.opacity = '1';
                        saveBtn.style.backgroundColor = '';
                        saveBtn.style.boxShadow = '';
                    }, 2000);
                }, 800);
            });
        }
    };

    // --- Execução Principal ---
    initCosmicBackground();
    initUIInteractions();
    console.log("[Sistema] GeneralReport (Cyber Mode) carregado com sucesso.");
});