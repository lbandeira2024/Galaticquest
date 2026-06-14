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
                            Somente um conjunto de virtudes que abordam a moral do sujeito, as de um líder, por exemplo, são capazes de torná-lo diferenciado, especial e diferenciado
                            em relação a outros líderes, em qualquer tipo de organização em que ele possa atuar.
                        </p>
                        <p>
                            Lembremos que o GALACTIC QUEST - O LÍDER CAMINHANTE é um game de educação corporativa, que se propõe a estimular basicamente um conjunto de
                            virtudes nas práticas da liderança, que é o que ocorre na vida do trabalho de diversos astronautas que foram criteriosamente escolhidos para uma grande
                            missão.
                        </p>
                        <p>
                            Tê-las equilibradas entre si, na fé e na ação, é uma obsessão para o alcance do que há de melhor dentro de cada um e, principalmente, para o
                            exercício da liderança, fazendo com que ela aconteça de maneira autêntica e sustentável ao longo da jornada no espaço sideral onde eles "caminham".
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
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>"Líder" dependente do outro e com baixa assertividade.</li>
                                <li>Dependente da opinião alheia; inseguro.</li>
                                <li>Despreza o autoconhecimento; tem um forte realismo prático como norteador da vida.</li>
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
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>É um "líder" pessimista; prostrado.</li>
                                <li>Autodesvalorização; não acredita em si mesmo.</li>
                                <li>Depressão; desiludido; não tem sonhos, projetos; acomodado e é cético demais.</li>
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
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Este "líder" tem medo de tomar a iniciativa e correr riscos.</li>
                                <li>"Líder" recluso; baixa auto estima.</li>
                                <li>Apresenta insegurança psicológica.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>AGIR COM A VERDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Saber remover o oculto, isto é, o "véu sobre algo esquecido" com sinceridade pelo bem comum.</li>
                                <li>Inspirar-se a ir além das aparências dos comportamentos, a questionar o previsto, a compreender ambiguidades e distinguir narrativas de fatos, ruídos de vieses.</li>
                                <li>Usar as regras e códigos estabelecidos com bom senso, que se transformam em práticas virtuosas no comportamento de liderança, sem jamais fugir do cerne da questão ou da essência das coisas.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>"Líder" desonesto, injusto, incoerente e dissimulado. Age pela conveniência.</li>
                                <li>Falsificação ou omissão de dados.</li>
                                <li>Mente em negociações, tendendo a encobrir erros ou má conduta.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>PAIXÃO POR PESSOAS</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Posicionar as pessoas em primeiro lugar.</li>
                                <li>Desenvolver a empatia e o acolhimento, além de promover o engajamento.</li>
                                <li>Ter a consciência sobre as decisões tomadas como líder, que impactam no ambiente e geram consequências.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Prefere o distanciamento como "líder".</li>
                                <li>Promove a evitação do contato, da conexão humana. Desconfia da virtude como algo transformador e que ajuda de verdade. Privilegia o individual ao invés do coletivo.</li>
                                <li>Tem desprezo pelas pessoas; o foco é apenas nos processos, metas e resultados.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>DISCIPLINA</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Atuar com método e lógica no trabalho, a observar os passos necessários para se chegar a uma solução satisfatória e possível.</li>
                                <li>Representa, na conexão, estimular o aprendizado do outro - a sua educação, para ser melhor do que se é, e para poder contribuir ao contexto.</li>
                                <li>Representa valorizar no outro a busca da teoria, de conceitos, de modelos, que o ajudem como líder/liderado a dar forma, a interpretar a realidade, a ver e enfrentar oportunidades e situações ou problemas.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Este "líder" apresenta falta de autocontrole; ausência de rigor, de método.</li>
                                <li>"Líder" com dificuldades de manter foco em metas/objetivos.</li>
                                <li>Tende a procrastinação, ociosidade e preguiça.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>SIMPLICIDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Representa levar a disciplina e pô-la em conexão na sua forma simples, através de uma linguagem totalmente acessível.</li>
                                <li>Observar a busca de maneiras para explicitar a análise de uma situação, conflito ou problema, observando o entendimento pleno do que se quer elucidar.</li>
                                <li>Saber se comunicar de modo eficaz, sem a fala hermética comum, promovendo sondagens sobre o entendimento.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Este "líder" se norteia pela ostentação e manutenção do status quo.</li>
                                <li>Este "líder" apresenta cobiça (desejo insaciável por dinheiro, bens, etc.). Avareza.</li>
                                <li>Confusão desnecessária (de criar complexidade sem necessidade de pensamentos, planos ou comunicação; dificuldade de ir direto ao ponto).</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>PROTAGONISMO</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Manifestar a prática do comportamento pioneiro - testando a ideia, o conceito e o modelo de algo, que ajuda a avançar/consolidar um processo de melhoria no contexto.</li>
                                <li>É um líder realizador, voluntário na jornada, que protagoniza as virtudes.</li>
                                <li>Sua voluntariedade está ligada diretamente a um propósito que foi construído. Revela habilidade de mudar as experiências e corrigir rumos com energia para transformar.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Este "líder" apresenta vitimismo (acomodado).</li>
                                <li>Apresenta inércia (acomodado, complacente, pouca energia mobilizadora).</li>
                                <li>É um "líder" reativo ao mundo, às pessoas e as ações importantes.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>HUMILDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Resume-se à capacidade de não superestimar o outro, nem se colocar abaixo dele. Não é de se auto promover.</li>
                                <li>Perspicaz, modesto, o ser humilde passa a ser admirado como pessoa, ao contrário daquele que se mostra fleumático e distante seus relacionamentos e pouco empático.</li>
                                <li>Confiável, promove, naturalmente, o engajamento e a conexão da equipe de trabalho, sabendo usar a gratidão.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Este "líder" apresenta passividade; auto-exploração.</li>
                                <li>Seu perfil é de alguém subserviente; servilismo.</li>
                                <li>Apresenta modéstia excessiva.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>GENEROSIDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Ajudar naturalmente os outros à serem melhores em suas competências técnicas e humanas.</li>
                                <li>Tem a consciência de que a solidariedade é suporte às pessoas em torno do propósito.</li>
                                <li>Respeitar profundamente a individualidade; incentivo ao engajamento; reconhecer, elogiar e agradecer. Promove o diálogo sensível, a empatia, e a harmonia entre lideranças e as pessoas de um modo geral.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Este "líder" tende a levar as pessoas/ equipe ao esgotamento (burnout).</li>
                                <li>Apresenta sentimento de inferioridade.</li>
                                <li>Explora o outro de forma ilimitada, buscando argumentos práticos e de resultados; "os fins justificam os meios".</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>PERSEVERANÇA</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Ser constante, firme e persistente em um propósito determinado, mesmo diante de obstáculos, dificuldades ou desânimo.</li>
                                <li>Manter o foco e o esforço em direção a um objetivo, resistindo à tentativa de desistir.</li>
                                <li>Ser uma fonte inspiradora para a prática de todas as virtudes, que está ligada à motivação, disciplina e à capacidade de superar a frustração e os reveses.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Desistência.</li>
                                <li>Impulsividade no sentido de ser incapaz de manter o foco.</li>
                                <li>Tende a ser um "líder" complacente, sem ímpeto; pode ser acomodado.</li>
                            </ul>
                        </div>

                        <div className="virtue-card">
                            <h4>RESPEITO À DIVERSIDADE</h4>
                            <p>Implica em:</p>
                            <ul>
                                <li>Ir além da tolerância, adotando na liderança uma postura ativa de reconhecimento da igualdade entre os diferentes; saber celebrar a riqueza que a variedade traz para a experiência virtuosa da equipe.</li>
                                <li>Criar uma cultura de inclusão na liderança, bem como de engajamento, ao explicitar quando necessário, que existem múltiplas perspectivas, histórias e modos de vida válidos.</li>
                                <li>Compreender a alteridade, regularizando o "outro" na sua singularidade.</li>
                            </ul>
                            <p className="vices-title">Seus Vícios:</p>
                            <ul className="vices-list">
                                <li>Este "líder" age com preconceito e estereótipos.</li>
                                <li>Age com discriminação e distanciamentos não observando outros aspectos da situação.</li>
                                <li>Individualista, tende a menosprezar o outro que age e pensa diferente. Age pela exclusão e pela não equidade, muitas vezes sem perceber.</li>
                            </ul>
                        </div>
                    </div>

                    <section className="acee-section">
                        <h3>ACEE (Agência Central de Exploração Espacial)</h3>

                        <div className="acee-content">
                            <h4>Missão:</h4>
                            <p>Empreender voos espaciais com foco na visitação, exploração de corpos celestes e na criação de novas colônias, para assegurar a preservação da espécie humana e o seu bem-estar, abrangendo toda comunidade do planeta Terra.</p>

                            <h4>Visão:</h4>
                            <p>Ser uma referência respeitada pelos terráqueos e empreendedores do segmento de tecnologia espacial, traduzida pela inteligência e fidelização das agências à ACEE, gerando a satisfação de stakeholders: governo, órgãos internacionais, investidores, comunidade científica, mídia internacional e cidadãos de todo o mundo.</p>

                            <h4>Valores:</h4>
                            <ul>
                                <li>Ética, respeito à ciência e aos protocolos recomendados que sirvam de orientação geral, e à diversidade.</li>
                                <li>Cuidados ilimitados com o meio ambiente espacial.</li>
                                <li>Sincronicidade entre as estações espaciais e agências estrangeiras, com espírito de equipe.</li>
                                <li>Tudo pela vida, paixão pelo ser humano.</li>
                                <li>Responsabilidade social, pensando o futuro que é agora.</li>
                                <li>Transparência: A informação é chave para tudo, assim como sua comunicação direta.</li>
                            </ul>
                        </div>
                    </section>

                    <div className="glossary-section">
                        <h3>GLOSSÁRIO GERAL</h3>
                        <p>MONITORES DE CONTROLE: Saber observá-los e correlacioná-los durante a jornada espacial, atentos também à Missão, aos Valores e as Virtudes, é fundamental para o sucesso da equipe de jogadores no game Galactic Quest – O Líder Caminhante. São eles:</p>

                        <div className="glossary-item">
                            <h4>PROPULSÃO NUCLEAR:</h4>
                            <p>Serve para gerar energia para impulsionar a espaçonave com maior autonomia, permitindo viagens mais rápidas e eficientes, especialmente para missões e destinos distantes. Mais versátil, ela pode ser usada para fornecer energia elétrica para outros sistemas da espaçonave, como comunicação e sistemas de suporte à vida.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>DIREÇÃO:</h4>
                            <p>Refere-se à orientação da espaçonave quanto ao seu sentido de movimento e trajetória. Através de instrumentos e sistemas de controle, os astronautas podem alterar a direção da espaçonave para realizar manobras, fazer ajustes de velocidade e correção de trajetória e mudar de órbita para atingir o destino.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>ESTABILIDADE:</h4>
                            <p>Refere-se à capacidade da espaçonave de manter a sua orientação e trajetória no espaço sem ser afetada por forças externas ou movimentos aleatórios. Ela é crucial para que a espaçonave possa realizar suas tarefas com precisão e segurança, como manter uma órbita, realizar manobras, ou até mesmo realizar experiências científicas.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>PRODUTIVIDADE:</h4>
                            <p>É a medida de desempenho da equipe no ambiente operacional influenciada pelas adaptações fisiológicas necessárias para operar na ausência de gravidade e sob outras condições espaciais, pela complexidade das tarefas a serem realizadas e pela eficácia das estratégias de suporte e mitigação implementadas. Avaliar e otimizá-la é fundamental para o sucesso e segurança da missão.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>ENGAJAMENTO:</h4>
                            <p>Corresponde à qualidade e o grau dos comportamentos e posturas assumidas nas decisões tomadas pela equipe de astronautas, observando os contextos-situações. Resume uma energia humana altamente positiva, cooperativa e inclusiva que reforça a conexão humana.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>OXIGÊNIO:</h4>
                            <p>Representa a concentração molecular (O2) presente na atmosfera artificial pressurizada dentro da espaçonave, essencial para sustentar a vida da tripulação e o funcionamento de certos sistemas, como por exemplo, de Sistemas de Controle Ambiental e de Suporte à Vida (ECLSS); Sistemas de Detecção e Supressão de Incêndio; Sistemas de Geração de Energia e o de Equipamentos Científicos para experimentos conduzidos a bordo para simular condições terrestres.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>INTERDEPENDÊNCIA:</h4>
                            <p>Refere-se ao grau de relacionamento e a intensidade de ajuda entre as equipes de astronautas durante a missão espacial.</p>
                        </div>

                        <h4>OUTROS ELEMENTOS IMPORTANTES PARA A JOGABILIDADE:</h4>

                        <div className="glossary-item">
                            <h4>MANDALA DAS VIRTUDES:</h4>
                            <p>Representa outro indicador importante de gestão e liderança, igualmente eficaz para operar a navegação e perseguir a missão. O sucesso da missão está atrelado a esta variável e indicador importante. A Mandala deve ser acionada imediatamente após a decisão tomada pela equipe que joga o Galactic Quest, a fim de se avaliar a qualidade da decisão tomada e fazer outras reflexões acerca das virtudes x vícios presentes na situação-problema.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>$PACECOINS:</h4>
                            <p>Refere-se a moeda corrente, isto é, a única transacional, presente no mundo da navegação e exploração espacial, utilizada entre os países que compõem o consórcio galático.</p>
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
                            <h4>CONTEXTO-SITUAÇÃO-DECISÃO (CSD'S):</h4>
                            <p>São ocorrências comportamentais de liderança que acontecem no dia a dia da navegação e que implicam no entendimento, análise e decisão do grupo participante da empresa, visando obter o melhor ambiente de trabalho, para que todos continuem a perseguir a rota traçada.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>DESAFIOS-EVENTOS:</h4>
                            <p>São ocorrências típicas e culturais, que aparecem aos astronautas durante a jornada exploratória e que ao vivenciá-las implica, entre outras coisas, fazer investimentos.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>DOBRA ESPACIAL:</h4>
                            <p>É o meio operacional utilizado durante a viagem espacial para aumentar a velocidade de deslocamento da espaçonave, permitindo a ela navegar com velocidade superior à da luz, sem violar as leis da relatividade de Einstein. Em vez de impulsionar a nave através do espaço, o motor de dobra manipula o espaço-tempo ao redor dela, contraindo-o à frente e expandindo-o atrás, em intervalos autoprogramados.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>INVENTÁRIO:</h4>
                            <p>Refere-se a todas as coisas “materiais” e tangíveis, que podem ser levadas pelos astronautas da equipe para a missão espacial, a fim de cumprirem um papel importante para a saúde mental e a ligação de todos eles com suas raízes culturais.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>S.O.S:</h4>
                            <p>Indica o risco iminente para a missão e espaçonave em termos de sua sobrevivência, impactando os indicadores cruciais - como os níveis de oxigênio e de propulsão nuclear (energia vital). Ele somente poderá ser ativado se houver spacecoins em caixa.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>PROCESSADOR 02:</h4>
                            <p>Quando acessado pelo grupo, o mecanismo da espaçonave permite o processamento e beneficiamento do material encontrado (água/gelo) em oxigênio no corpo celeste, para fins de sobrevivência da equipe e da missão no espaço.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>CORPOS CELESTES COM PRESENÇA DE ÁGUA:</h4>
                            <p>Calisto, Caronte, Ceres, Encélado, Éris, Europa, Ganímedes, Haumea, Júpiter, Lua, Marte, Makemake, Mercúrio, Oberon, Plutão, Próximo Centauri b, Terra, Titã, Titânia, Trappist-1e, Tritão e Vesta.</p>
                        </div>

                        <div className="glossary-item">
                            <h4>CORPOS CELESTES COM AUSÊNCIA DE ÁGUA:</h4>
                            <p>Deimos, Fobos, Io, Kepler-186f, Mimas, Netuno, Pallas, Proteu, Saturno, Vênus e Urano.</p>
                        </div>
                    </div>

                    <section className="virtues-table-section">
                        <h3>QUADRO DAS DOZE VIRTUDES CHAVES QUE TRADUZEM O LÍDER TRANSFORMADOR, E SUAS ANTÍTESES (VÍCIOS)[cite: 59]:</h3>
                        <div className="table-responsive">
                            <table className="galactic-table">
                                <thead>
                                    <tr>
                                        <th>VIRTUDE</th>
                                        <th>IMPLICA EM</th>
                                        <th>SEUS VÍCIOS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="virtue-name">CONHECER A SI MESMO [cite: 21]</td>
                                        <td>
                                            <ul>
                                                <li>Procurar de forma contínua o auto conhecimento[cite: 26, 27].</li>
                                                <li>Conseguir identificar, avaliar e refletir sobre os impactos de seus comportamentos, conhecendo-se melhor nas pessoas e grupos sociais diversos[cite: 28].</li>
                                                <li>Ter maturidade suficiente para se posicionar de forma assertiva, e encaminhar as melhores soluções em qualquer contexto que estiver envolvido[cite: 29].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>“Líder” dependente do outro e com baixa assertividade[cite: 47].</li>
                                                <li>Dependente da opinião alheia; inseguro[cite: 48].</li>
                                                <li>Despreza o autoconhecimento; tem um forte realismo prático como norteador da vida[cite: 49].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">PROPÓSITO [cite: 22]</td>
                                        <td>
                                            <ul>
                                                <li>Ter um sonho, uma grande meta, um conjunto de metas menores – que estimule, impulsione – a cada um de nós, e na relação com o outro; ter uma razão para lutar com orgulho[cite: 31, 32].</li>
                                                <li>Ter disposição e entusiasmo de querer realizar o sonho sonhado, que se transforma em planos realizáveis[cite: 33].</li>
                                                <li>Saber transformar a ideia em projeto e materializá-la como possível, fazendo com que nasça a esperança em outros, e acompanhá-lo com entusiasmo[cite: 34].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>É um “líder” pessimista; prostrado[cite: 50].</li>
                                                <li>Autodesvalorização; não acredita em si mesmo[cite: 51].</li>
                                                <li>Depressão; desiludido; não tem sonhos, projetos; acomodado e é cético demais[cite: 52].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">CORAGEM [cite: 23]</td>
                                        <td>
                                            <ul>
                                                <li>Tomar decisões que envolvam incertezas e a possibilidade de perdas, com o objetivo de alcançar algo importante[cite: 36].</li>
                                                <li>Agir em defesa de outras pessoas que estão sendo injustiçadas, ou que não têm voz, mesmo que implique em riscos pessoais[cite: 37].</li>
                                                <li>Agir, apesar do medo, com o coração e de acordo com suas convicções para transformar a realidade, ou situação[cite: 38].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Este “líder” tem medo de tomar a inicia-tiva e correr riscos[cite: 53].</li>
                                                <li>“Líder” recluso; baixa auto estima[cite: 54].</li>
                                                <li>Apresenta insegurança psicológica[cite: 55].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">AGIR COM A VERDADE [cite: 24]</td>
                                        <td>
                                            <ul>
                                                <li>Saber remover o oculto, isto é, o “véu sobre algo esquecido” com sinceridade pelo bem comum[cite: 40].</li>
                                                <li>Inspirar-se a ir além das aparências dos comportamentos, a questionar o previsto, a compreender ambiguidades e distinguir narrativas de fatos, ruídos de vieses[cite: 41].</li>
                                                <li>Usar as regras e códigos estabelecidos com bom senso, que se transformam em práticas virtuosas no comportamento de liderança, sem jamais fugir do cerne da questão ou da essência das coisas[cite: 42].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>“Líder” desonesto, injusto, incoerente e dissimulado. Age pela conveniência[cite: 56].</li>
                                                <li>Falsificação ou omissão de dados[cite: 57].</li>
                                                <li>Mente em negociações, tendendo a encobrir erros ou má conduta[cite: 58].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">DISCIPLINA [cite: 60]</td>
                                        <td>
                                            <ul>
                                                <li>Atuar com método e lógica no trabalho, a observar os passos necessários para se chegar a uma solução satisfatória e possível[cite: 65].</li>
                                                <li>Representa, na conexão, estimular o aprendizado do outro – a sua educação, para ser melhor do que se é, e para poder contribuir ao contexto[cite: 66].</li>
                                                <li>Representa valorizar no outro a busca da teoria, de conceitos, de modelos, que o ajudem como líder/liderado a dar forma, a interpretar a realidade, a ver e enfrentar oportunidades e situações ou problemas[cite: 67].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Este “líder” apresenta falta de autocontrole; ausência de rigor, de método[cite: 85].</li>
                                                <li>“Líder” com dificuldades de manter foco em metas/objetivos[cite: 86].</li>
                                                <li>Tende a procrastinação, ociosidade e preguiça[cite: 87].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">PAIXÃO POR PESSOAS [cite: 61]</td>
                                        <td>
                                            <ul>
                                                <li>Posicionar as pessoas em primeiro lugar[cite: 69].</li>
                                                <li>Desenvolver a empatia e o acolhimento, além de promover o engajamento[cite: 70].</li>
                                                <li>Ter a consciência sobre as decisões tomadas como líder, que impactam no ambiente e geram consequências[cite: 71].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Prefere o distanciamento como “líder”[cite: 88].</li>
                                                <li>Promove a evitação do contato, da conexão humana. Desconfia da virtude como algo transformador e que ajuda de verdade[cite: 89]. Privilegia o individual ao invés do coletivo[cite: 90].</li>
                                                <li>Tem desprezo pelas pessoas; o foco é apenas nos processos, metas e resultados[cite: 91].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">GENEROSIDADE [cite: 62]</td>
                                        <td>
                                            <ul>
                                                <li>Ajudar naturalmente os outros à serem melhores em suas competências técnicas e humanas[cite: 73].</li>
                                                <li>Tem a consciência de que a solidarieda-de é suporte às pessoas em torno do propósito[cite: 74].</li>
                                                <li>Respeitar profundamente a individualidade; incentivo ao engajamento; reconhecer, elogiar e agradecer[cite: 75]. Promove o diálogo sensível, a empatia, e a harmonia entre lideranças e as pessoas de um modo geral[cite: 76].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Este “líder” tende a levar as pessoas/ equipe ao esgotamento (burnout)[cite: 92].</li>
                                                <li>Apresenta sentimento de inferioridade[cite: 93].</li>
                                                <li>Explora o outro de forma ilimitada, buscando argumentos práticos e de resultados; “os fins justificam os meios”[cite: 94].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">SIMPLICIDADE [cite: 63]</td>
                                        <td>
                                            <ul>
                                                <li>Representa levar a disciplina e pô-la em conexão na sua forma simples, através de uma linguagem totalmente acessível[cite: 78].</li>
                                                <li>Observar a busca de maneiras para explicitar a análise de uma situação, conflito ou problema, observando o entendimento pleno do que se quer elucidar[cite: 79].</li>
                                                <li>Saber se comunicar de modo eficaz, sem a fala hermética comum, promovendo sondagens sobre o entendimento[cite: 80].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Este “líder” se norteia pela ostentação e manutenção do status quo[cite: 95].</li>
                                                <li>Este “líder” apresenta cobiça (desejo insaciável por dinheiro, bens, etc.). Avareza[cite: 96].</li>
                                                <li>Confusão desnecessária (de criar complexidade sem necessidade de pensamentos, planos ou comunicação; dificuldade de ir direto ao ponto[cite: 97].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">HUMILDADE [cite: 98]</td>
                                        <td>
                                            <ul>
                                                <li>Resume-se à capacidade de não superestimar o outro, nem se colocar abaixo dele. Não é de se auto promover[cite: 103].</li>
                                                <li>Perspicaz, modesto, o ser humilde passa a ser admirado como pessoa, ao contrário daquele que se mostra fleumático e distante seus relacionamentos e pouco empático[cite: 104].</li>
                                                <li>Confiável, promove, naturalmente, o engajamento e a conexão da equipe de trabalho, sabendo usar a gratidão[cite: 105].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Este “líder” apresenta passividade; auto-exploração[cite: 124].</li>
                                                <li>Seu perfil é de alguém subserviente; servilismo[cite: 125].</li>
                                                <li>Apresenta modéstia excessiva[cite: 126].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">PERSEVERANÇA [cite: 99]</td>
                                        <td>
                                            <ul>
                                                <li>Ser constante, firme e persistente em um propósito determinado, mesmo diante de obstáculos, dificuldades ou desânimo[cite: 107].</li>
                                                <li>Manter o foco e o esforço em direção a um objetivo, resistindo à tentativa de desistir[cite: 108].</li>
                                                <li>Ser uma fonte inspiradora para a prática de todas as virtudes, que está ligada à motivação, disciplina e à capacidade de superar a frustração e os reveses[cite: 109].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Desistência[cite: 127].</li>
                                                <li>Impulsividade no sentido de ser incapaz de manter o foco[cite: 128].</li>
                                                <li>Tende a ser um “líder” complacente, sem ímpeto; pode ser acomodado[cite: 129].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">PROTAGONISMO [cite: 100]</td>
                                        <td>
                                            <ul>
                                                <li>Manifestar a prática do comportamento pioneiro – testando a ideia, o conceito e o modelo de algo, que ajuda a avançar/consolidar um processo de melhoria no contexto[cite: 111].</li>
                                                <li>É um líder realizador, voluntário na jornada, que protagoniza as virtudes[cite: 112].</li>
                                                <li>Sua voluntariedade está ligada diretamente a um propósito que foi construído[cite: 113]. Revela habilidade de mudar as experiências e corrigir rumos com energia para transformar[cite: 114].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Este “líder” apresenta vitimismo (acomodado)[cite: 130].</li>
                                                <li>Apresenta inércia (acomodado, complacente, pouca energia mobilizadora)[cite: 131].</li>
                                                <li>É um “líder” reativo ao mundo, às pessoas e as ações importantes[cite: 132].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="virtue-name">RESPEITO À DIVERSIDADE [cite: 101]</td>
                                        <td>
                                            <ul>
                                                <li>Ir além da tolerância, adotando na liderança uma postura ativa de reconhecimento da igualdade entre os diferentes [cite: 116]; saber celebrar a riqueza que a variedade traz para a experiência virtuosa da equipe[cite: 117].</li>
                                                <li>Criar uma cultura de inclusão na liderança, bem como de engajamento, ao explicitar quando necessário, que existem múltiplas perspectivas, histórias e modos de vida válidos[cite: 118].</li>
                                                <li>Compreender a alteridade, regularizando o “outro” na sua singularidade[cite: 119].</li>
                                            </ul>
                                        </td>
                                        <td className="vice-text">
                                            <ul>
                                                <li>Este “líder” age com preconceito e estereótipos[cite: 133].</li>
                                                <li>Age com discriminação e distanciamentos não observando outros aspectos da situação[cite: 134].</li>
                                                <li>Individualista, tende a menosprezar o outro que age e pensa diferente[cite: 135]. Age pela exclusão e pela não equidade, muitas vezes sem perceber[cite: 136].</li>
                                            </ul>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>
            )}

            <button className="close-popup-btn" onClick={onClose}>
                ×
            </button>
        </div>
    );
};

export default GalacticVirtudesPage;