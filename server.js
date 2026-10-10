require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_BASE_URL = process.env.APP_BASE_URL;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY
  || process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_PUBLISHABLE_KEY
  || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas. Verifique .env');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'mydb',
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function hashSenha(senha) {
  return crypto.createHash('sha256').update(String(senha)).digest('hex');
}

function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function enviarEmailRecuperacao(email, token) {
  const linkRecuperacao = new URL('/', APP_BASE_URL);
  linkRecuperacao.searchParams.set('token', token);

  const resposta = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: email,
        reset_link: linkRecuperacao.href,
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`EmailJS respondeu com HTTP ${resposta.status}: ${detalhe}`);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API funcionando' });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
    }

    const emailNormalizado = normalizarEmail(email);
    const senhaHash = hashSenha(senha);

    const { data: admin, error: erroAdmin } = await supabase
      .from('administradores')
      .select('*')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (erroAdmin) {
      console.error('Erro ao consultar administradores:', erroAdmin);
      return res.status(503).json({ success: false, message: 'Banco de dados indisponível. Verifique o schema exposto no Supabase.' });
    }

    if (admin && admin.senha === senhaHash) {
      return res.json({
        success: true,
        tipo: 'admin',
        usuario: {
          id: admin.idadmin,
          nome: admin.nome,
          email: admin.email,
        },
      });
    }

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (erroUsuario) {
      console.error('Erro ao consultar usuarios:', erroUsuario);
      return res.status(503).json({ success: false, message: 'Banco de dados indisponível. Verifique o schema exposto no Supabase.' });
    }

    if (usuario && usuario.senha === senhaHash) {
      return res.json({
        success: true,
        tipo: 'usuario',
        usuario: {
          id: usuario.idusuarios,
          nome: usuario.nome,
          email: usuario.email,
        },
      });
    }

    return res.status(401).json({ success: false, message: 'Email ou senha incorretos.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro ao autenticar.' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ success: false, message: 'Nome, email e senha são obrigatórios.' });
    }

    if (String(senha).length < 6) {
      return res.status(400).json({ success: false, message: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const emailNormalizado = normalizarEmail(email);

    const { data: usuarioExistente, error: erroConsulta } = await supabase
      .from('usuarios')
      .select('idusuarios')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (erroConsulta) {
      throw erroConsulta;
    }

    if (usuarioExistente) {
      return res.status(409).json({ success: false, message: 'Este email já está cadastrado.' });
    }

    const { data, error } = await supabase.from('usuarios').insert([
      {
        nome: String(nome).trim(),
        email: emailNormalizado,
        senha: hashSenha(senha),
      },
    ]).select();

    if (error) {
      throw error;
    }

    const usuarioCriado = data?.[0];
    const { senha: senhaArmazenada, ...usuarioSeguro } = usuarioCriado || {};

    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso.',
      usuario: usuarioSeguro,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro ao cadastrar usuário.' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email obrigatório.' });
    }

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY || !APP_BASE_URL) {
      return res.status(503).json({
        success: false,
        message: 'O envio de email não está configurado no servidor.',
      });
    }

    const emailNormalizado = normalizarEmail(email);

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('idusuarios, email')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (erroUsuario) throw erroUsuario;

    let conta = usuario;
    let tabela = 'usuarios';
    let colunaId = 'idusuarios';

    if (!conta) {
      const { data: admin, error: erroAdmin } = await supabase
        .from('administradores')
        .select('idadmin, email')
        .eq('email', emailNormalizado)
        .maybeSingle();

      if (erroAdmin) throw erroAdmin;
      conta = admin;
      tabela = 'administradores';
      colunaId = 'idadmin';
    }

    if (conta) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const { error: erroToken } = await supabase
        .from(tabela)
        .update({ token_recuperacao: token, token_expira_em: expiraEm })
        .eq(colunaId, conta[colunaId]);

      if (erroToken) throw erroToken;

      try {
        await enviarEmailRecuperacao(conta.email, token);
      } catch (erroEmail) {
        await supabase
          .from(tabela)
          .update({ token_recuperacao: null, token_expira_em: null })
          .eq(colunaId, conta[colunaId])
          .eq('token_recuperacao', token);
        throw erroEmail;
      }
    }

    return res.json({
      success: true,
      message: 'Se o email estiver cadastrado, enviaremos um link de recuperação.',
    });
  } catch (error) {
    console.error(error);
    return res.status(503).json({ success: false, message: 'Não foi possível enviar o email de recuperação.' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios.' });
    }

    if (String(novaSenha).length < 6) {
      return res.status(400).json({ success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const usuario = await supabase
      .from('usuarios')
      .select('*')
      .eq('token_recuperacao', token)
      .maybeSingle();

    if (usuario.data && usuario.data.token_expira_em && new Date(usuario.data.token_expira_em).getTime() > Date.now()) {
      await supabase
        .from('usuarios')
        .update({
          senha: hashSenha(novaSenha),
          token_recuperacao: null,
          token_expira_em: null,
        })
        .eq('idusuarios', usuario.data.idusuarios);

      return res.json({ success: true, message: 'Senha atualizada com sucesso.' });
    }

    const admin = await supabase
      .from('administradores')
      .select('*')
      .eq('token_recuperacao', token)
      .maybeSingle();

    if (admin.data && admin.data.token_expira_em && new Date(admin.data.token_expira_em).getTime() > Date.now()) {
      await supabase
        .from('administradores')
        .update({
          senha: hashSenha(novaSenha),
          token_recuperacao: null,
          token_expira_em: null,
        })
        .eq('idadmin', admin.data.idadmin);

      return res.json({ success: true, message: 'Senha atualizada com sucesso.' });
    }

    return res.status(400).json({ success: false, message: 'Token inválido ou expirado.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro ao redefinir senha.' });
  }
});

app.get('/api/pontos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pontos_turisticos')
      .select('*')
      .order('idpontos_turisticos', { ascending: true });

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar pontos turísticos.' });
  }
});

app.post('/api/pontos', async (req, res) => {
  try {
    const { nome, foto, descricao, localizacao } = req.body;
    if (!nome || !descricao || !localizacao) {
      return res.status(400).json({ message: 'Nome, descrição e localização são obrigatórios.' });
    }

    const { data, error } = await supabase
      .from('pontos_turisticos')
      .insert({ nome, foto: foto || null, descricao, endereco: localizacao })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao cadastrar ponto turístico.' });
  }
});

app.put('/api/pontos/:id', async (req, res) => {
  try {
    const { nome, foto, descricao, localizacao } = req.body;
    const { data, error } = await supabase
      .from('pontos_turisticos')
      .update({ nome, foto: foto || null, descricao, endereco: localizacao })
      .eq('idpontos_turisticos', req.params.id)
      .select()
      .single();

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao atualizar ponto turístico.' });
  }
});

app.delete('/api/pontos/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('pontos_turisticos')
      .delete()
      .eq('idpontos_turisticos', req.params.id);

    if (error) throw error;
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao remover ponto turístico.' });
  }
});

app.get('/api/pontos/:id/avaliacoes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('nota')
      .eq('ponto_id', req.params.id);

    if (error) throw error;
    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar avaliações.' });
  }
});

app.post('/api/pontos/:id/avaliacoes', async (req, res) => {
  try {
    const { usuarioId, nota } = req.body;
    if (!usuarioId || !Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ message: 'Usuário e nota entre 1 e 5 são obrigatórios.' });
    }

    const { data, error } = await supabase
      .from('avaliacoes')
      .insert({ usuario_id: usuarioId, ponto_id: req.params.id, nota })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao registrar avaliação.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

module.exports = app;
