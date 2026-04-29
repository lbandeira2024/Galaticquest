document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LER VARIÁVEL DA URL ---
    // Captura o ?gameNumber=X passado pelo GameConfig.js
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameNumber');

    // Atualiza o título da página se o gameNumber existir
    const titleElement = document.getElementById('pageTitle');
    if (titleElement && gameId) {
        titleElement.textContent = `REGRAS E PONTUAÇÃO - GAME ${gameId}`;
    }

    // --- 2. ANIMAÇÃO DO FUNDO ESTELAR ---
    const canvas = document.getElementById('spaceCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let stars = [];

        // Inicializa as estrelas
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 1.5,
                speed: Math.random() * 0.3 + 0.1
            });
        }

        function animateStars() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

            stars.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();

                star.y += star.speed;

                // Reposiciona a estrela no topo quando sai da tela
                if (star.y > window.innerHeight) {
                    star.y = 0;
                    star.x = Math.random() * window.innerWidth;
                }
            });
            requestAnimationFrame(animateStars);
        }

        // Ajusta o canvas se a tela mudar de tamanho
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        // Configuração inicial do Canvas e disparo da animação
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        animateStars();
    }

    // --- 3. INTERAÇÃO DOS BOTÕES ---

    // Interação com as "Tags" de Biomas
    const tags = document.querySelectorAll('.cyber-tag');
    tags.forEach(tag => {
        tag.addEventListener('click', function () {
            this.classList.toggle('active');
        });
    });

    // Menu esquerdo
    const actionTabs = document.querySelectorAll('.action-tab-btn');
    actionTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            actionTabs.forEach(t => t.classList.remove('active-neon'));
            this.classList.add('active-neon');
        });
    });

    // Menu direito
    const navItems = document.querySelectorAll('.nav-menu-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(i => i.classList.remove('active-nav'));
            this.classList.add('active-nav');
        });
    });

    // Botão de salvar
    const saveButton = document.querySelector('.primary-neon');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const numeroGameStr = gameId ? ` para o GAME ${gameId}` : '';
            alert(`Configurações de Regras e Pontuação salvas com sucesso${numeroGameStr}!`);
        });
    }
});