# API de Agendamento - Backend

Esta é a API backend para o sistema de agendamento desenvolvido com Fastify, Prisma e TypeScript.

## 🚀 Tecnologias Utilizadas

- **Fastify** - Framework web rápido e eficiente
- **Prisma** - ORM moderno para TypeScript/JavaScript
- **@fastify/jwt** - Plugin oficial do Fastify para JWT
- **TypeScript** - Tipagem estática
- **Zod** - Validação de esquemas
- **bcrypt** - Hash de senhas
- **PostgreSQL** - Banco de dados

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL (ou Docker)
- npm ou yarn

## ⚙️ Configuração

### Opção 1: Usando Docker (Recomendado)

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd back_end

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz do projeto com:
DATABASE_URL="postgresql://agendamento:agendamento@localhost:5432/agendamento"
JWT_SECRET="your-super-secret-jwt-key-here"

# 4. Inicie tudo de uma vez (Docker + Migrações + Seed + Servidor)
npm run dev:full
```

### Opção 2: Configuração Manual

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd back_end

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz do projeto com:
DATABASE_URL="postgresql://username:password@localhost:5432/agendamento_mae"
JWT_SECRET="your-super-secret-jwt-key-here"

# 4. Execute as migrações do banco
npm run db:migrate

# 5. Execute o seed para criar dados de exemplo
npm run seed

# 6. Inicie o servidor
npm run dev
```

## 🌱 Seed do Banco de Dados

O projeto inclui um script de seed que cria dados de exemplo para desenvolvimento:

### Dados Criados pelo Seed:

- **2 Médicos** (doctor)

  - Dr. João Silva (admin@hospital.com) - Senha: `admin123`
  - Dra. Maria Oliveira (maria.doctor@hospital.com) - Senha: `admin123`

- **1 Atendente** (attendant)

  - Ana Atendente (ana@hospital.com) - Senha: `attendant`

- **3 Pacientes** (patient)

  - Carlos Santos (carlos@email.com) - Senha: `123456789`
  - Pedro Oliveira (pedro@email.com) - Senha: `123456789`
  - Fernanda Costa (fernanda@email.com) - Senha: `123456789`

- **1 Responsável** (parents)

  - Roberto Mendes (roberto@email.com) - Senha: `123456789`

- **8 Disponibilidades** (horários dos médicos)
- **2 Agendamentos** de exemplo
- **2 Atendimentos** de exemplo
- **2 Notificações** de exemplo

### Comandos do Seed:

```bash
# Executar apenas o seed
npm run seed

# Reset do banco + seed
npm run seed:dev

# Reset completo (migrações + seed)
npm run db:reset:seed
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:3333/docs

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação:

1. **Login**: `POST /user/login`
2. **Registrar**: `POST /user`
3. **Usar token**: Inclua o header `Authorization: Bearer <token>`

### Payload do JWT

O token JWT contém as seguintes informações:

```json
{
  "userId": "string",
  "register": "patient" | "parents" | "doctor" | "attendant",
  "iat": "timestamp",
  "exp": "timestamp"
}
```

### Tipos de Registro

- **patient**: Paciente
- **parents**: Pais/Responsáveis
- **doctor**: Médico (apenas admins podem criar)
- **attendant**: Atendente

## 📊 Estrutura do Banco

### Modelo Users

- `id`: Identificador único
- `name`: Nome do usuário
- `email`: Email (único)
- `password`: Senha (hash)
- `cpf`: CPF (único)
- `phone`: Telefone
- `birthDate`: Data de nascimento
- `address`: Endereço
- `register`: Tipo de registro (patient, parents, doctor)

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Start (produção)
npm start

# Testes
npm test

# Prisma
npm run db:migrate
npm run db:generate
npm run db:studio
```
