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
- PostgreSQL
- npm ou yarn

## ⚙️ Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd back_end
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/agendamento_mae"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# SMTP (opcional para emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_EMAIL="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

### 4. Execute as migrações do banco

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Inicie o servidor

```bash
npm run dev
```

## 📚 Documentação da API

Após iniciar o servidor, acesse:

- **Swagger UI**: http://localhost:3000/docs

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação:

1. **Login**: `POST /usuario/login`
2. **Registrar**: `POST /usuario`
3. **Usar token**: Inclua o header `Authorization: Bearer <token>`

### Payload do JWT

O token JWT contém as seguintes informações:

```json
{
  "userId": "string",
  "register": "patient" | "parents" | "doctor",
  "iat": "timestamp",
  "exp": "timestamp"
}
```

### Tipos de Registro

- **patient**: Paciente
- **parents**: Pais/Responsáveis
- **doctor**: Médico (apenas admins podem criar)

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
