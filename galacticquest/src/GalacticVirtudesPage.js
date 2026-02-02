import React, { useState, useEffect } from 'react';
import './GalacticVirtudesPage.css';

const GalacticVirtudesPage = ({ onClose }) => {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const createStars = () => {
            const container = document.querySelector('.galactic-popup-content');
            if (!container) return;

            const existingStars = container.querySelectorAll('.star');
            existingStars.forEach(star => star.remove());

            const starCount = window.innerWidth < 768 ? 30 : 60;

            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star';

                const size = Math.random() * 2;
                star.style.cssText = `
                    top: ${Math.random() * 100}%;
                    left: ${Math.random() * 100}%;
                    width: ${size}px;
                    height: ${size}px;
                    --duration: ${2 + Math.random() * 3}s;
                    animation-delay: ${Math.random() * 5}s;
                    opacity: ${0.2 + Math.random() * 0.8};
                `;

                container.appendChild(star);
            }
        };

        createStars();
        return () => {
            const stars = document.querySelectorAll('.star');
            stars.forEach(star => star.remove());
        };
    }, []);

    return (
        <div className="galactic-popup-content">
            <div className="galactic-header">
                <img
                    src="/images/Minerva/Minerva_Active.gif"
                    alt="Minerva"
                    className="minerva-logo"
                />
                <h1>GALACTIC QUEST</h1>
                <h2>A JORNADA DO LÍDER CAMINHANTE</h2>

                <button
                    className={`virtues-toggle-btn ${showContent ? 'active' : ''}`}
                    onClick={() => setShowContent(!showContent)}
                >
                    {showContent ? 'OCULTAR VIRTUDES' : 'REVELAR VIRTUDES'}
                </button>
            </div>

            {showContent && (
                <div className="virtues-content">
                    <section className="virtues-intro">
                        <h3>AS VIRTUDES NO GALACTIC QUEST:</h3>
                        <p>
                            Somente um conjunto de virtudes que abordam a moral do sujeito, as de um líder, por exemplo, são capazes de torná-lo diferente, especial e diferenciado
                            em relação a outros líderes, em qualquer tipo de organização em que ele possa atuar.
                        </p>
                        <p>
                            Lembremos que o GALACTIC QUEST - O LÍDER CAMINHANTE é um game de educação corporativa, que se propõe a estimular basicamente um conjunto de
                            virtudes nas práticas da liderança, que é o que ocorre na vida do trabalho de diversos astronautas que foram criteriosamente escolhidos para uma grande
                            missão.
                        </p>
                        <p>
                            Tê-las equilibradas entre si, na fé e na ação, é uma obsessão para o alcance do que há de melhor dentro de cada um e, principalmente, para o exercício da
                            liderança, fazendo com que ela aconteça de maneira autêntica e sustentável, ao longo da jornada no espaço sideral onde eles "caminham".
                        </p>
                        <p>
                            As virtudes servem para interpretar comportamentos no plano individual, mas ganha notória relevância e significado no game quando constroem o que é
                            belo ao promoverem a conexão humana valorizando o "outro", observando o contexto, a situação e a melhor solução para o conflito ou "problema" que
                            aparece.
                        </p>
                    </section>

                    <div className="virtues-grid">
                        <div className="virtue-card">
                            <h4>CONHECER A SI MESMO</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Procurar de forma contínua o autoconhecimento. Conhecer os próprios sentimentos, limitações, potenciais, dificuldades e mecanismos de atuação.</li>
                                <li>Conseguir identificar, avaliar e refletir sobre os impactos de seus comportamentos, conhecendo-se melhor - nas pessoas e grupos sociais diversos.</li>
                                <li>Ter maturidade suficiente para se posicionar assertivamente, e encaminhar as melhores soluções em qualquer contexto que estiver envolvido.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>PROPÓSITO</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Ter um sonho, uma grande meta, um conjunto de metas menores - que estimule, impulsione - a cada um de nós, e na relação com o outro; ter uma razão para lutar, com orgulho.</li>
                                <li>Ter disposição e entusiasmo de querer realizar o sonho sonhado, que se transforma em planos realizáveis.</li>
                                <li>Saber transformar a ideia em projeto e materializá-la como possível, fazendo com que nasça a esperança de outros o acompanharem com entusiasmo.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>CORAGEM</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Tomar decisões que envolvem incerteza e a possibilidade de perdas, com o objetivo de alcançar algo importante.</li>
                                <li>Agir em defesa de outras pessoas que estão sendo injustiçadas, ou que não tem voz, mesmo que implique em riscos pessoais.</li>
                                <li>Agir, apesar do medo, com o coração e de acordo com suas convicções para transformar a realidade, ou situação.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>BUSCA DA VERDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Saber remover o oculto, isto é, o "véu sobre algo esquecido" com sinceridade.</li>
                                <li>Inspirar-se a ir além das aparências dos comportamentos, a questionar o estabelecido, a compreender ambiguidades e distinguir narrativas de fatos, ruídos de vieses.</li>
                                <li>Usar das regras e códigos estabelecidos com bom senso, que se transformam em práticas virtuosas no comportamento de liderança, sem jamais fugir do cerne da questão ou essência das coisas.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>PAIXÃO POR PESSOAS</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Posicionar as pessoas em primeiro lugar.</li>
                                <li>Desenvolver a empatia e o acolhimento, e promover o engajamento.</li>
                                <li>Ter consciência sobre as decisões tomadas como líder, que impactam no ambiente e geram consequências.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>DISCIPLINA</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Atuar com método e lógica no trabalho, a observar os passos necessários para se chegar a uma solução satisfatória e possível.</li>
                                <li>Representa, na conexão, estimular o aprendizado do outro - a sua educação, para ser melhor do que se é, e para poder contribuir ao contexto.</li>
                                <li>Representa valorizar no outro a busca da teoria, de conceitos, de modelos, que o ajudem como líder/liderado a dar forma, a interpretar a realidade, a ver e encarar oportunidades e situações ou problemas.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>SIMPLICIDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Representa levar a disciplina, em conexão, à sua forma simples, através de uma linguagem plenamente acessível.</li>
                                <li>A observar a busca de maneiras para explicitar a análise de uma situação, conflito ou problema, observando o entendimento pleno do que se quer elucidar.</li>
                                <li>Saber se comunicar de modo eficaz, sem a fala hermética comum, promovendo sondagens sobre o entendimento.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>PROTAGONISMO</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Manifestar a prática do comportamento pioneiro - testando a ideia, o conceito e o modelo de algo, que ajude a avançar/consolidar um processo de melhoria no contexto.</li>
                                <li>É um líder realizador, voluntarioso na jornada, que protagoniza as virtudes.</li>
                                <li>Sua voluntariedade está ligada diretamente a ter um propósito que constrói. Revela habilidade de mudar as experiências e corrigir rumos, com energia para transformar.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>HUMILDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Refere-se a uma capacidade que não super estima o outro nem se coloca abaixo dele. Não aprecia a auto promoção.</li>
                                <li>Perspicaz, modesto, o ser humilde passa a ser admirado como pessoa, contrário daquele que se mostra soberbo em seus relacionamentos, que, como vício, é pouco empático.</li>
                                <li>Confiável, promove naturalmente o engajamento e a conexão da equipe de trabalho, sabendo usar da gratidão.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>GENEROSIDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Ajudar naturalmente os outros à serem melhores em suas competências técnicas e humanas.</li>
                                <li>Tem a consciência de que a solidariedade une liderados/pessoas em torno do propósito (s).</li>
                                <li>Respeitar profundamente a individualidade; incentivar o engajamento; reconhecer, elogiar e agradecer. Promover o diálogo sensível, a empatia, e a harmonia entre liderados e as pessoas de um modo geral.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>PERSEVERANÇA</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Ser constante, firme e persistente em um determinado propósito, mesmo diante de obstáculos, dificuldades ou desânimo.</li>
                                <li>Manter o foco e o esforço em direção a um objetivo, resistindo à tentação de desistir.</li>
                                <li>Ser a fonte inspiradora para a prática de todas as virtudes, que está ligada à motivação, disciplina e à capacidade de superar a frustração e os reveses.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>RESPEITO À DIVERSIDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Ir além da tolerância, adotando na liderança uma postura ativa de reconhecimento da igualdade entre os diferentes; sabe celebrar a riqueza que a variedade traz para a experiência virtuosa de sua equipe.</li>
                                <li>Criar uma cultura de inclusão na liderança, bem como de engajamento, ao explicitar, quando necessário, que existem múltiplas perspectivas, histórias e modos de vida válidos.</li>
                                <li>Compreender a alteridade, reconhecendo o "outro" na sua singularidade.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="glossary-section">
                        <h3>GLOSSÁRIO GERAL</h3>
                        <p>MONITORES DE CONTROLE: Saber observá-los e correlacioná-los durante a jornada espacial, atentos também à Missão, aos Valores e as Virtudes, é fundamental para o sucesso da equipe de jogadores no game Galactic Quest – O Líder Caminhante. São eles:</p>

                        <div className="glossary-item">
                            <h4>PROPULSÃO NUCLEAR:</h4>
                            <p>Serve para gerar energia para impulsionar a espaçonave com maior autonomia, permitindo viagens mais rápidas e eficientes, especialmente para missões e destinos distantes. Mais versátil, ela pode ser usada para fornecer energia elétrica para outros sistemas da espaçonave, como comunicação e sistemas de suporte à vida.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>DIREÇÃO:</h4>
                            <p>Refere-se à orientação da espaçonave quanto ao seu sentido de movimento e trajetória. Através de instrumentos e sistemas de controle, os astronautas pode alterar a direção da espaçonave para realizar manobras, fazer ajustes de velocidade e correção de trajetória e mudar de órbita para atingir o destino.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>ESTABILIDADE:</h4>
                            <p>Refere-se à capacidade da espaçonave de manter a sua orientação e trajetória no espaço, sem ser afetada por forças externas ou movimentos aleatórios. Ela é crucial para que a espaçonave possa realizar as suas tarefas com precisão e segurança, como manter uma órbita, realizar manobras, ou até mesmo realizar experiências científicas.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>PRODUTIVIDADE:</h4>
                            <p>É a medida de desempenho da equipe no ambiente operacional influenciada pelas adaptações fisiológicas necessárias para operar na ausência de gravidade e sob outras condições espaciais, pela complexidade das tarefas a serem realizadas e pela eficácia das estratégias de suporte e mitigação implementadas. Avaliar e otimizá-la é fundamental para o sucesso e segurança da missão.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>ENGAJAMENTO:</h4>
                            <p>Corresponde à qualidade e o grau dos comportamentos e posturas assumidas nas decisões tomadas pela equipe de astronautas, observando os contextos-situações. Resume uma energia humana altamente positiva, cooperativa e inclusiva.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>OXIGÊNIO:</h4>
                            <p>Representa a concentração molecular (O2) presente na atmosfera artificial pressurizada dentro da espaçonave, essencial para sustentar a vida da tripulação e o funcionamento de certos sistemas, como por exemplo, de Sistemas de Controle Ambiental e de Suporte à Vida (ECLSS); Sistemas de Detecção e Supressão de Incêndio; Sistemas de Geração de Energia e o de Equipamentos Científicos para experimentos conduzidos a bordo para simular condições terrestres.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>INTERDEPENDÊNCIA:</h4>
                            <p>Refere-se ao grau de relacionamento e a intensidade de ajuda entre as equipes que jogam o game.</p>
                        </div>

                        <h4>OUTROS ELEMENTOS IMPORTANTES PARA A JOGABILIDADE:</h4>

                        <div className="glossary-item">
                            <h4>MANDALA DAS VIRTUDES:</h4>
                            <p>Representa outro indicador importante de gestão e liderança, igualmente eficaz para operar a navegação e perseguir a missão. O sucesso da missão está atrelado a esta variável e indicador importante.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>$PACECOINS:</h4>
                            <p>Refere-se a moeda corrente, isto é a única transacional, presente no mundo da navegação e exploração espacial, utilizada entre os países que compõem o consórcio galático.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>EQUIPES DE ASTRONAUTAS:</h4>
                            <p>Compreende 27 "operários" do espaço sideral especializados no mundo galáctico divididos em cinco equipes, com competências para a exploração espacial e construção de colônias. Eles representam o consórcio de diferentes países e nacionalidades, tais como: EUA (6), Rússia (2), Canadá (2), Brasil (2), Espanha (2), Japão (2), Itália (2), Países Árabes (2), China (1), Israel (1), Grécia (1), México (1), Polônia (1), Romênia (1) e República Tcheca (1).</p>
                        </div>

                        <div className="glossary-item">
                            <h4>PIRATAS:</h4>
                            <p>Desconhecido suas origens, eles são seres alienígenas capazes de saquear, destruir colônias e eliminar vidas humanas, motivados pela prática de vícios imorais, ou até amorais dependendo das circunstâncias.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>SITUAÇÃO-CONTEXTO-DECISÃO (CSD'S):</h4>
                            <p>São ocorrências comportamentais de liderança, que acontecem no dia a dia da navegação e que implicam no entendimento, análise e decisão do grupo participante visando obter o melhor ambiente de trabalho, para que todos continuem a perseguir a rota traçada.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>DESAFIOS-EVENTOS:</h4>
                            <p>São ocorrências típicas e culturais, que aparecem aos astronautas durante a jornada exploratória e que ao vivenciá-las implica, entre outras coisas, fazer investimentos.</p>
                        </div>
                    </div>
                </div>
            )}

            <button className="close-popup-btn" onClick={onClose}>
                ×
            </button>
        </div>
    );
};

export default GalacticVirtudesPage;