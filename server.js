require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas. Verifique .env');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
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

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (!erroUsuario && usuario && usuario.senha === senhaHash) {
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

    const { data: admin, error: erroAdmin } = await supabase
      .from('administradores')
      .select('*')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (!erroAdmin && admin && admin.senha === senhaHash) {
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

    const { data: usuarioExistente } = await supabase
      .from('usuarios')
      .select('idusuarios')
      .eq('email', emailNormalizado)
      .maybeSingle();

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

    return res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso.',
      usuario: data?.[0],
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

    const emailNormalizado = normalizarEmail(email);

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await supabase
        .from('usuarios')
        .update({
          token_recuperacao: token,
          token_expira_em: expiraEm,
        })
        .eq('idusuarios', usuario.idusuarios);

      return res.json({
        success: true,
        message: 'Token de recuperação gerado com sucesso.',
        token,
      });
    }

    const { data: admin } = await supabase
      .from('administradores')
      .select('*')
      .eq('email', emailNormalizado)
      .maybeSingle();

    if (admin) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await supabase
        .from('administradores')
        .update({
          token_recuperacao: token,
          token_expira_em: expiraEm,
        })
        .eq('idadmin', admin.idadmin);

      return res.json({
        success: true,
        message: 'Token de recuperação gerado com sucesso.',
        token,
      });
    }

    return res.status(404).json({ success: false, message: 'Email não encontrado.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Erro ao gerar token de recuperação.' });
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
