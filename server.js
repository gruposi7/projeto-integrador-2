require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

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
