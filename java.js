
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
        mostrarMensagem(`Bem-vindo, ${usuario.nome}!`, 'sucesso');
        cactoFeliz();
        
        setTimeout(() => {
            console.log('Login realizado com sucesso!');
        }, 1500);
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

window.addEventListener('click', function(e) {
    if (e.target === modalCadastro) {
        fecharModal(modalCadastro);
    }
    if (e.target === modalRecuperar) {
        fecharModal(modalRecuperar);
    }
});

window.addEventListener('load', function() {
    const usuarios = localStorage.getItem('usuarios');
    if (!usuarios) {
        salvarUsuario('demo@email.com', '123456', 'Usuário Demo');
        console.log('Usuário de demo criado: demo@email.com / 123456');
    }
});
