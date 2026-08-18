# Projeto Integrador 2
Usuario ADM:
admin@desbravando.com

senha do ADM:
Admin@123

Node.js e Express seriam usados posteriormente para criar um servidor e uma API. Essa API poderia:

Salvar usuários em um banco de dados real.
Salvar pontos turísticos de forma permanente.
Compartilhar pontos entre todos os usuários.
Armazenar avaliações no servidor.
Proteger corretamente o acesso do administrador.
Permitir acesso de vários dispositivos.


A arquitetura ficaria assim:


Para o seu projeto, eu recomendaria:

SQLite para começar, por ser simples e não exigir instalação de servidor.
PostgreSQL se quiser algo mais próximo de um sistema de produção.
As tabelas principais seriam:

usuarios
pontos_turisticos
avaliacoes

A aparência e o funcionamento visual podem continuar praticamente iguais. O JavaScript apenas deixaria de salvar diretamente no navegador e passaria a fazer requisições para o Express.

O melhor caminho é manter a interface congelada como está e desenvolver o backend separadamente. Depois, fazemos a ligação tela por tela, sem redesenhar o projeto.

Uma ordem adequada seria:

Criar o servidor Node.js com Express.
Criar o banco e as tabelas.
Criar a API de usuários.
Criar a API de pontos turísticos.
Criar a API de avaliações.
Trocar o armazenamento local pelas requisições à API.
Testar administrador e usuário.
Publicar o sistema.