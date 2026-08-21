
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
const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
    const resposta = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    const dados = resposta.status === 204 ? null : await resposta.json();
    if (!resposta.ok) throw new Error(dados?.message || 'Não foi possível concluir a operação.');
    return dados;
}

function normalizarPonto(ponto) {
    return {
        ...ponto,
        id: String(ponto.idpontos_turisticos),
        localizacao: ponto.endereco || ''
    };
}

const ADMIN_EMAIL = 'admin@desbravando.com';
const ADMIN_SENHA_HASH = 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7';

const USUARIOS_PADRAO = [
    { nome: 'Renato', email: 'renato@email.com', senha: 'renato123' },
    { nome: 'Guilherme', email: 'guilherme@email.com', senha: 'guilherme123' }
];

function normalizarEmail(email) {
    return email.trim().toLowerCase();
}

async function hashSenha(senha) {
    if (!window.crypto || !window.crypto.subtle) {
        return senha;
    }

    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha));
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

function obterUsuarios() {
    try {
        const dados = JSON.parse(localStorage.getItem('usuarios'));
        return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
    } catch (erro) {
        return {};
    }
}

async function salvarUsuario(email, senha, nome) {
    const usuarios = obterUsuarios();
    usuarios[normalizarEmail(email)] = {
        nome: nome,
        senha: await hashSenha(senha),
        dataCriacao: new Date().toLocaleString()
    };
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

function localizarUsuario(usuarios, email) {
    const emailNormalizado = normalizarEmail(email);
    const chave = Object.keys(usuarios).find((chaveUsuario) => normalizarEmail(chaveUsuario) === emailNormalizado);
    return chave ? usuarios[chave] : null;
}

async function verificarUsuario(email, senha) {
    const usuarios = obterUsuarios();
    const usuario = localizarUsuario(usuarios, email);
    if (!usuario) {
        return false;
    }

    const senhaHash = await hashSenha(senha);
    return usuario.senha === senhaHash || usuario.senha === senha;
}

function usuarioExiste(email) {
    const usuarios = obterUsuarios();
    return localizarUsuario(usuarios, email) !== null;
}

function obterUsuario(email) {
    const usuarios = obterUsuarios();
    return localizarUsuario(usuarios, email);
}

async function criarUsuariosPadrao() {
    const usuariosExistentes = obterUsuarios();
    let houveAlteracao = false;

    for (const usuarioPadrao of USUARIOS_PADRAO) {
        const emailPadrao = normalizarEmail(usuarioPadrao.email);
        if (!usuariosExistentes[emailPadrao]) {
            usuariosExistentes[emailPadrao] = {
                nome: usuarioPadrao.nome,
                senha: await hashSenha(usuarioPadrao.senha),
                dataCriacao: new Date().toLocaleString()
            };
            houveAlteracao = true;
        }
    }

    if (houveAlteracao) {
        localStorage.setItem('usuarios', JSON.stringify(usuariosExistentes));
    }
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


loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = normalizarEmail(document.getElementById('email').value);
    const senha = document.getElementById('senha').value;
    
    if (!email || !senha) {
        mostrarMensagem('Por favor, preencha todos os campos', 'erro');
        return;
    }
    
    try {
        const resposta = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
        localStorage.setItem('usuarioLogado', email);
        localStorage.setItem('tipoUsuario', resposta.tipo);
        localStorage.setItem('idUsuario', resposta.usuario.id);
        if (resposta.tipo === 'admin') {
            fecharModal(modalAdmin);
            document.querySelector('.login-container').hidden = true;
            document.body.classList.add('modo-admin');
            painelAdmin.hidden = false;
            await renderizarPontos();
        } else {
            await abrirTelaUsuario(resposta.usuario);
        }
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
    
    loginForm.reset();
});


linkCriarConta.addEventListener('click', function(e) {
    e.preventDefault();
    abrirModal(modalCadastro);
});

cadastroForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('cadNome').value.trim();
    const email = normalizarEmail(document.getElementById('cadEmail').value);
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
    
    try {
        await apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({ nome, email, senha })
        });
        mostrarMensagem('Conta criada com sucesso! Faça login', 'sucesso');
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
        return;
    }
    
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
    abrirModal(modalRecuperar);
});

recuperarForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = normalizarEmail(document.getElementById('recEmail').value);
    
    if (!email) {
        mostrarMensagem('Por favor, digite um email', 'erro');
        return;
    }
    
    try {
        const resposta = await apiRequest('/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        mostrarMensagem(resposta.message, 'sucesso');
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
        return;
    }
    
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
    abrirModal(modalAdmin);
});

adminForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value.trim();
    const senha = document.getElementById('adminSenha').value;

    try {
        const resposta = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
        if (resposta.tipo !== 'admin') throw new Error('Este usuário não é administrador.');
        localStorage.setItem('usuarioLogado', email);
        localStorage.setItem('tipoUsuario', 'admin');
        localStorage.setItem('idUsuario', resposta.usuario.id);
        fecharModal(modalAdmin);
        document.querySelector('.login-container').hidden = true;
        document.body.classList.add('modo-admin');
        painelAdmin.hidden = false;
        adminForm.reset();
        await renderizarPontos();
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
});

async function renderizarPontos() {
    let pontos;
    try {
        pontos = (await apiRequest('/pontos')).map(normalizarPonto);
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
        return;
    }

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

pontoForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (localStorage.getItem('tipoUsuario') !== 'admin') {
        mostrarMensagem('Acesso permitido somente ao administrador', 'erro');
        return;
    }

    const id = document.getElementById('pontoId').value;
    const ponto = {
        nome: document.getElementById('pontoNome').value.trim(),
        foto: pontoFoto.value.trim(),
        descricao: document.getElementById('pontoDescricao').value.trim(),
        localizacao: document.getElementById('pontoLocalizacao').value.trim()
    };
    try {
        await apiRequest(id ? `/pontos/${id}` : '/pontos', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(ponto)
        });
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
        return;
    }
    pontoForm.reset();
    document.getElementById('pontoId').value = '';
    tituloFormularioPonto.textContent = 'Adicionar ponto turístico';
    btnCancelarEdicao.hidden = true;
    await renderizarPontos();
});

listaPontos.addEventListener('click', async function(e) {
    const pontoId = e.target.dataset.editarPonto || e.target.dataset.removerPonto;
    if (!pontoId || localStorage.getItem('tipoUsuario') !== 'admin') return;

    const pontos = (await apiRequest('/pontos')).map(normalizarPonto);
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
        await apiRequest(`/pontos/${pontoId}`, { method: 'DELETE' });
        await renderizarPontos();
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
    document.body.classList.remove('modo-admin');
});

async function abrirTelaUsuario(usuario) {
    document.querySelector('.login-container').hidden = true;
    document.body.classList.add('modo-usuario');
    telaUsuario.hidden = false;
    saudacaoUsuario.textContent = `Bem-vindo, ${usuario.nome}! Confira os pontos turísticos cadastrados.`;
    await renderizarPontosUsuario();
}

function renderizarEstrelas(pontoId, media) {
    return Array.from({ length: 5 }, (_, indice) => {
        const valor = indice + 1;
        const ativo = valor <= Math.round(media) ? ' active' : '';
        return `<button type="button" class="star-button${ativo}" data-avaliar-ponto="${pontoId}" data-nota="${valor}" aria-label="Avaliar com ${valor} estrela${valor > 1 ? 's' : ''}">&#9733;</button>`;
    }).join('');
}

async function renderizarPontosUsuario() {
    let pontos;
    try {
        pontos = (await apiRequest('/pontos')).map(normalizarPonto);
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
        return;
    }
    const pontosComAvaliacoes = await Promise.all(pontos.map(async (ponto) => ({
        ...ponto,
        avaliacoes: await apiRequest(`/pontos/${ponto.id}/avaliacoes`)
    })));
    contadorPontos.textContent = `${pontosComAvaliacoes.length} ${pontosComAvaliacoes.length === 1 ? 'lugar encontrado' : 'lugares encontrados'}`;

    if (pontosComAvaliacoes.length === 0) {
        listaPontosUsuario.innerHTML = '<p class="empty-points">Ainda não há pontos turísticos cadastrados.</p>';
        return;
    }

    listaPontosUsuario.innerHTML = pontosComAvaliacoes.map((ponto) => {
        const quantidadeAvaliacoes = ponto.avaliacoes.length;
        const media = quantidadeAvaliacoes
            ? ponto.avaliacoes.reduce((total, avaliacao) => total + avaliacao.nota, 0) / quantidadeAvaliacoes
            : 0;
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

listaPontosUsuario.addEventListener('click', async function(e) {
    const botao = e.target.closest('[data-avaliar-ponto]');
    if (!botao || localStorage.getItem('tipoUsuario') !== 'usuario') return;

    const pontoId = botao.dataset.avaliarPonto;
    try {
        await apiRequest(`/pontos/${pontoId}/avaliacoes`, {
            method: 'POST',
            body: JSON.stringify({
                usuarioId: localStorage.getItem('idUsuario'),
                nota: Number(botao.dataset.nota)
            })
        });
        await renderizarPontosUsuario();
    } catch (error) {
        mostrarMensagem(error.message, 'erro');
    }
});

btnSairUsuario.addEventListener('click', function() {
    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('tipoUsuario');
    telaUsuario.hidden = true;
    document.querySelector('.login-container').hidden = false;
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

window.addEventListener('load', async function() {
    const usuarios = localStorage.getItem('usuarios');
    if (!usuarios) {
        await criarUsuariosPadrao();
        console.log('Usuários padrão criados: Renato e Guilherme');
    } else {
        await criarUsuariosPadrao();
    }
});
