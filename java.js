
const cacto = document.getElementById('cacto');
let estadoCacto = 'normal'; 


document.addEventListener('mousemove', function(e) {
    const cactoRect = cacto.getBoundingClientRect();
    const cactoX = cactoRect.left + cactoRect.width / 2;
    const cactoY = cactoRect.top + cactoRect.height / 2;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    
    const deltaX = mouseX - cactoX;
    const deltaY = mouseY - cactoY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    
    const normX = distance > 0 ? deltaX / distance : 0;
    const normY = distance > 0 ? deltaY / distance : 0;
    
  
    const olhoEsquerdo = document.getElementById('olhoEsquerdo');
    const olhoDireito = document.getElementById('olhoDireito');
    
    const offsetMovement = 3;
    const newEyeOffsetX = normX * offsetMovement;
    const newEyeOffsetY = normY * offsetMovement;
    
    olhoEsquerdo.setAttribute('cx', 90 + newEyeOffsetX);
    olhoEsquerdo.setAttribute('cy', 140 + newEyeOffsetY);
    
    olhoDireito.setAttribute('cx', 110 + newEyeOffsetX);
    olhoDireito.setAttribute('cy', 140 + newEyeOffsetY);
});


document.addEventListener('click', function(e) {
    const elemento = e.target;
    
   
    const botaoPrincipal = elemento.closest('.btn-primary');
    
  
    const linkCorreto = elemento.closest('.link-action');
    

    if (botaoPrincipal) {
        cactoFeliz();
    }
    
    else if (linkCorreto) {
        cactoFeliz();
    }
   
    else if (!elemento.closest('.login-card') && !elemento.closest('.modal-content')) {
        cactoTriste();
    }
});


function cactoFeliz() {
    estadoCacto = 'feliz';
    cacto.classList.remove('triste', 'pulo', 'estado-triste');
    cacto.classList.add('feliz', 'estado-feliz');
    
    
    setTimeout(() => {
        cacto.classList.remove('feliz', 'estado-feliz');
        estadoCacto = 'normal';
    }, 800);
}

function cactoTriste() {
    estadoCacto = 'triste';
    cacto.classList.remove('feliz', 'pulo', 'estado-feliz');
    cacto.classList.add('triste', 'estado-triste');
    
   
    setTimeout(() => {
        cacto.classList.remove('triste', 'estado-triste');
        estadoCacto = 'normal';
    }, 500);
}


setInterval(() => {
    if (estadoCacto === 'normal') {
        const olhoEsquerdo = document.getElementById('olhoEsquerdo');
        const olhoDireito = document.getElementById('olhoDireito');
        
        olhoEsquerdo.style.transition = 'r 0.1s ease';
        olhoDireito.style.transition = 'r 0.1s ease';
        
        olhoEsquerdo.setAttribute('r', '0');
        olhoDireito.setAttribute('r', '0');
        
        setTimeout(() => {
            olhoEsquerdo.setAttribute('r', '4');
            olhoDireito.setAttribute('r', '4');
        }, 100);
    }
}, Math.random() * 4000 + 2000); 


const loginForm = document.getElementById('loginForm');
const cadastroForm = document.getElementById('cadastroForm');
const recuperarForm = document.getElementById('recuperarForm');

const linkCriarConta = document.getElementById('linkCriarConta');
const linkRecuperarSenha = document.getElementById('linkRecuperarSenha');
const closeCadastro = document.getElementById('closeCadastro');
const closeRecuperar = document.getElementById('closeRecuperar');

const modalCadastro = document.getElementById('modalCadastro');
const modalRecuperar = document.getElementById('modalRecuperar');
const mensagem = document.getElementById('mensagem');
const btnAdmin = document.getElementById('btnAdmin');
const adminForm = document.getElementById('adminForm');
const modalAdmin = document.getElementById('modalAdmin');
const closeAdmin = document.getElementById('closeAdmin');
const painelAdmin = document.getElementById('painelAdmin');
const btnSairAdmin = document.getElementById('btnSairAdmin');
const pontoForm = document.getElementById('pontoForm');
const listaPontos = document.getElementById('listaPontos');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const tituloFormularioPonto = document.getElementById('tituloFormularioPonto');
const pontoFoto = document.getElementById('pontoFoto');
const pontoFotoPreview = document.getElementById('pontoFotoPreview');
const telaUsuario = document.getElementById('telaUsuario');
const listaPontosUsuario = document.getElementById('listaPontosUsuario');
const contadorPontos = document.getElementById('contadorPontos');
const saudacaoUsuario = document.getElementById('saudacaoUsuario');
const btnSairUsuario = document.getElementById('btnSairUsuario');

const ADMIN_EMAIL = 'admin@desbravando.com';
const ADMIN_SENHA = 'Admin@123';


function salvarUsuario(email, senha, nome) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};
    usuarios[email] = {
        nome: nome,
        senha: btoa(senha), 
        dataCriacao: new Date().toLocaleString()
    };
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

function verificarUsuario(email, senha) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};
    if (usuarios[email]) {
        return usuarios[email].senha === btoa(senha);
    }
    return false;
}

function usuarioExiste(email) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};
    return usuarios.hasOwnProperty(email);
}

function obterUsuario(email) {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};
    return usuarios[email];
}


function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem show ${tipo}`;
    
    setTimeout(() => {
        mensagem.classList.remove('show');
    }, 4000);
}


function abrirModal(modal) {
    modal.classList.add('show');
}

function fecharModal(modal) {
    modal.classList.remove('show');
}


loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    
    if (!email || !senha) {
        mostrarMensagem('Por favor, preencha todos os campos', 'erro');
        cactoTriste();
        return;
    }
    
    if (verificarUsuario(email, senha)) {
        const usuario = obterUsuario(email);
        localStorage.setItem('usuarioLogado', email);
        localStorage.setItem('tipoUsuario', 'usuario');
        abrirTelaUsuario(usuario);
        cactoFeliz();
    } else {
        mostrarMensagem('Email ou senha incorretos', 'erro');
        cactoTriste();
    }
    
    loginForm.reset();
});


linkCriarConta.addEventListener('click', function(e) {
    e.preventDefault();
    cactoFeliz();
    abrirModal(modalCadastro);
});

cadastroForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('cadNome').value.trim();
    const email = document.getElementById('cadEmail').value.trim();
    const senha = document.getElementById('cadSenha').value;
    const confirma = document.getElementById('cadConfirma').value;
    

    if (!nome || !email || !senha || !confirma) {
        mostrarMensagem('Por favor, preencha todos os campos', 'erro');
        return;
    }
    
    if (nome.length < 3) {
        mostrarMensagem('Nome deve ter no mínimo 3 caracteres', 'erro');
        return;
    }
    
    if (!email.includes('@')) {
        mostrarMensagem('Email inválido', 'erro');
        return;
    }
    
    if (senha.length < 6) {
        mostrarMensagem('Senha deve ter no mínimo 6 caracteres', 'erro');
        return;
    }
    
    if (senha !== confirma) {
        mostrarMensagem('As senhas não conferem', 'erro');
        return;
    }
    
    if (usuarioExiste(email)) {
        mostrarMensagem('Este email já está registrado', 'erro');
        return;
    }
    
  
    salvarUsuario(email, senha, nome);
    mostrarMensagem('Conta criada com sucesso! Faça login', 'sucesso');
    cactoFeliz();
    
    cadastroForm.reset();
    setTimeout(() => {
        fecharModal(modalCadastro);
    }, 1500);
});

closeCadastro.addEventListener('click', function() {
    fecharModal(modalCadastro);
    cadastroForm.reset();
});


linkRecuperarSenha.addEventListener('click', function(e) {
    e.preventDefault();
    cactoFeliz();
    abrirModal(modalRecuperar);
});

recuperarForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('recEmail').value.trim();
    
    if (!email) {
        mostrarMensagem('Por favor, digite um email', 'erro');
        return;
    }
    
    if (!usuarioExiste(email)) {
        mostrarMensagem('Email não encontrado no sistema', 'erro');
        return;
    }
    
    
    mostrarMensagem(`Link de recuperação enviado para ${email}`, 'sucesso');
    cactoFeliz();
    console.log(`[SIMULADO] Email de recuperação enviado para: ${email}`);
    
    recuperarForm.reset();
    setTimeout(() => {
        fecharModal(modalRecuperar);
    }, 2000);
});

closeRecuperar.addEventListener('click', function() {
    fecharModal(modalRecuperar);
    recuperarForm.reset();
});

btnAdmin.addEventListener('click', function() {
    cactoFeliz();
    abrirModal(modalAdmin);
});

adminForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value.trim();
    const senha = document.getElementById('adminSenha').value;

    if (email !== ADMIN_EMAIL || senha !== ADMIN_SENHA) {
        mostrarMensagem('Email ou senha de administrador incorretos', 'erro');
        cactoTriste();
        return;
    }

    localStorage.setItem('usuarioLogado', ADMIN_EMAIL);
    localStorage.setItem('tipoUsuario', 'admin');
    fecharModal(modalAdmin);
    document.querySelector('.login-container').hidden = true;
    cacto.hidden = true;
    document.body.classList.add('modo-admin');
    painelAdmin.hidden = false;
    adminForm.reset();
    renderizarPontos();
    cactoFeliz();
});

function obterPontos() {
    return JSON.parse(localStorage.getItem('pontosTuristicos')) || [];
}

function salvarPontos(pontos) {
    localStorage.setItem('pontosTuristicos', JSON.stringify(pontos));
}

function renderizarPontos() {
    const pontos = obterPontos();

    if (pontos.length === 0) {
        listaPontos.innerHTML = '<p class="empty-points">Nenhum ponto turístico cadastrado.</p>';
        return;
    }

    listaPontos.innerHTML = pontos.map((ponto) => `
        <article class="point-item">
            <h4>${escaparHtml(ponto.nome)}</h4>
            <p>${escaparHtml(ponto.descricao)}</p>
            <p><strong>Localização:</strong> ${escaparHtml(ponto.localizacao)}</p>
            <div class="point-actions">
                <button type="button" class="btn btn-secondary" data-editar-ponto="${ponto.id}">Editar</button>
                <button type="button" class="btn btn-admin" data-remover-ponto="${ponto.id}">Remover</button>
            </div>
        </article>
    `).join('');
}

function obterLinkLocalizacao(localizacao) {
    const texto = localizacao.trim();
    if (/^https?:\/\//i.test(texto)) return texto;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(texto)}`;
}

function escaparHtml(texto) {
    const elemento = document.createElement('div');
    elemento.textContent = texto;
    return elemento.innerHTML;
}

pontoForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (localStorage.getItem('tipoUsuario') !== 'admin') {
        mostrarMensagem('Acesso permitido somente ao administrador', 'erro');
        return;
    }

    const id = document.getElementById('pontoId').value;
    const ponto = {
        id: id || Date.now().toString(),
        nome: document.getElementById('pontoNome').value.trim(),
        foto: pontoFoto.value.trim(),
        descricao: document.getElementById('pontoDescricao').value.trim(),
        localizacao: document.getElementById('pontoLocalizacao').value.trim()
    };
    const pontos = obterPontos();
    const indice = pontos.findIndex((item) => item.id === id);

    if (indice >= 0) {
        pontos[indice] = ponto;
    } else {
        pontos.push(ponto);
    }

    salvarPontos(pontos);
    pontoForm.reset();
    document.getElementById('pontoId').value = '';
    tituloFormularioPonto.textContent = 'Adicionar ponto turístico';
    btnCancelarEdicao.hidden = true;
    renderizarPontos();
});

listaPontos.addEventListener('click', function(e) {
    const pontoId = e.target.dataset.editarPonto || e.target.dataset.removerPonto;
    if (!pontoId || localStorage.getItem('tipoUsuario') !== 'admin') return;

    const pontos = obterPontos();
    const ponto = pontos.find((item) => item.id === pontoId);

    if (e.target.dataset.editarPonto && ponto) {
        document.getElementById('pontoId').value = ponto.id;
        document.getElementById('pontoNome').value = ponto.nome;
        pontoFoto.value = ponto.foto || '';
        atualizarPreviewFoto();
        document.getElementById('pontoDescricao').value = ponto.descricao;
        document.getElementById('pontoLocalizacao').value = ponto.localizacao;
        tituloFormularioPonto.textContent = 'Editar ponto turístico';
        btnCancelarEdicao.hidden = false;
        document.getElementById('pontoNome').focus();
    }

    if (e.target.dataset.removerPonto) {
        salvarPontos(pontos.filter((item) => item.id !== pontoId));
        renderizarPontos();
    }
});

btnCancelarEdicao.addEventListener('click', function() {
    pontoForm.reset();
    document.getElementById('pontoId').value = '';
    tituloFormularioPonto.textContent = 'Adicionar ponto turístico';
    btnCancelarEdicao.hidden = true;
    pontoFotoPreview.hidden = true;
});

function atualizarPreviewFoto() {
    const url = pontoFoto.value.trim();
    if (!url) {
        pontoFotoPreview.hidden = true;
        pontoFotoPreview.removeAttribute('src');
        return;
    }

    pontoFotoPreview.src = url;
    pontoFotoPreview.hidden = false;
}

pontoFoto.addEventListener('input', atualizarPreviewFoto);
pontoFotoPreview.addEventListener('error', function() {
    pontoFotoPreview.hidden = true;
    mostrarMensagem('Não foi possível carregar essa imagem. Use o link direto da foto.', 'erro');
});

btnSairAdmin.addEventListener('click', function() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('tipoUsuario');
    painelAdmin.hidden = true;
    document.querySelector('.login-container').hidden = false;
    cacto.hidden = false;
    document.body.classList.remove('modo-admin');
});

function abrirTelaUsuario(usuario) {
    document.querySelector('.login-container').hidden = true;
    cacto.hidden = true;
    document.body.classList.add('modo-usuario');
    telaUsuario.hidden = false;
    saudacaoUsuario.textContent = `Bem-vindo, ${usuario.nome}! Confira os pontos turísticos cadastrados.`;
    renderizarPontosUsuario();
}

function obterAvaliacoes() {
    return JSON.parse(localStorage.getItem('avaliacoesPontos')) || {};
}

function renderizarEstrelas(pontoId, media) {
    return Array.from({ length: 5 }, (_, indice) => {
        const valor = indice + 1;
        const ativo = valor <= Math.round(media) ? ' active' : '';
        return `<button type="button" class="star-button${ativo}" data-avaliar-ponto="${pontoId}" data-nota="${valor}" aria-label="Avaliar com ${valor} estrela${valor > 1 ? 's' : ''}">&#9733;</button>`;
    }).join('');
}

function calcularMedia(pontoId) {
    const avaliacoes = obterAvaliacoes()[pontoId] || [];
    if (avaliacoes.length === 0) return 0;
    return avaliacoes.reduce((total, nota) => total + nota, 0) / avaliacoes.length;
}

function renderizarPontosUsuario() {
    const pontos = obterPontos();
    contadorPontos.textContent = `${pontos.length} ${pontos.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}`;

    if (pontos.length === 0) {
        listaPontosUsuario.innerHTML = '<p class="empty-points">Ainda não há pontos turísticos cadastrados.</p>';
        return;
    }

    listaPontosUsuario.innerHTML = pontos.map((ponto) => {
        const media = calcularMedia(ponto.id);
        const quantidadeAvaliacoes = (obterAvaliacoes()[ponto.id] || []).length;
        const foto = ponto.foto;
        const linkLocalizacao = obterLinkLocalizacao(ponto.localizacao);

        return `
            <article class="user-point-card">
                <img src="${escaparHtml(foto)}" alt="Foto de ${escaparHtml(ponto.nome)}" class="point-photo" loading="lazy">
                <div class="point-card-body">
                    <h3>${escaparHtml(ponto.nome)}</h3>
                    <a class="point-location" href="${escaparHtml(linkLocalizacao)}" target="_blank" rel="noopener noreferrer">&#128205; ${escaparHtml(ponto.localizacao)}</a>
                    <p class="point-description">${escaparHtml(ponto.descricao)}</p>
                    <div class="rating-area">
                        <div class="stars" role="group" aria-label="Avaliação de ${escaparHtml(ponto.nome)}">${renderizarEstrelas(ponto.id, media)}</div>
                        <span class="rating-summary">${media ? media.toFixed(1) : 'Sem nota'} (${quantidadeAvaliacoes})</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    listaPontosUsuario.querySelectorAll('.point-photo').forEach((imagem) => {
        imagem.addEventListener('error', function() {
            this.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500"><rect width="900" height="500" fill="#dfe7e9"/><text x="450" y="250" text-anchor="middle" fill="#607277" font-family="Arial" font-size="28">Imagem indisponível</text></svg>');
            this.classList.add('photo-unavailable');
        }, { once: true });
    });
}

listaPontosUsuario.addEventListener('click', function(e) {
    const botao = e.target.closest('[data-avaliar-ponto]');
    if (!botao || localStorage.getItem('tipoUsuario') !== 'usuario') return;

    const avaliacoes = obterAvaliacoes();
    const pontoId = botao.dataset.avaliarPonto;
    if (!avaliacoes[pontoId]) avaliacoes[pontoId] = [];
    avaliacoes[pontoId].push(Number(botao.dataset.nota));
    localStorage.setItem('avaliacoesPontos', JSON.stringify(avaliacoes));
    renderizarPontosUsuario();
});

btnSairUsuario.addEventListener('click', function() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('tipoUsuario');
    telaUsuario.hidden = true;
    document.querySelector('.login-container').hidden = false;
    cacto.hidden = false;
    document.body.classList.remove('modo-usuario');
});

window.addEventListener('click', function(e) {
    if (e.target === modalCadastro) {
        fecharModal(modalCadastro);
    }
    if (e.target === modalRecuperar) {
        fecharModal(modalRecuperar);
    }
    if (e.target === modalAdmin) {
        fecharModal(modalAdmin);
    }
});

window.addEventListener('load', function() {
    const usuarios = localStorage.getItem('usuarios');
    if (!usuarios) {
        salvarUsuario('demo@email.com', '123456', 'Usuário Demo');
        console.log('Usuário de demo criado: demo@email.com / 123456');
    }
});
