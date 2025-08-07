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

#### 🏥 **3 Organizações**

- **Hospital Principal** - Hospital de referência em São Paulo
- **Clínica Especializada** - Clínica especializada em cardiologia
- **Consultório Dr. Carlos** - Consultório particular

#### 👨‍⚕️ **3 Profissionais** (professional)

- **Dr. João Silva** (admin@hospital.com) - Senha: `admin123`
- **Dra. Maria Oliveira** (maria.doctor@hospital.com) - Senha: `admin123`
- **Dr. Carlos Santos** (carlos.doctor@consultorio.com) - Senha: `admin123`

#### 👩 **2 Atendentes** (attendant)

- **Ana Atendente** (ana@hospital.com) - Senha: `123456789`
- **Beatriz Atendente** (beatriz@clinica.com) - Senha: `123456789`

#### 👥 **5 Pacientes** (patient)

- **Carlos Santos** (carlos@email.com) - Senha: `123456789`
- **Pedro Oliveira** (pedro@email.com) - Senha: `123456789`
- **Fernanda Costa** (fernanda@email.com) - Senha: `123456789`
- **Roberto Mendes** (roberto@email.com) - Senha: `123456789`
- **Lucia Silva** (lucia@email.com) - Senha: `123456789`

#### 🔗 **Relacionamentos UserOrganization**

- Usuários associados a diferentes organizações com diferentes papéis
- **Papéis disponíveis**: owner, admin, professional, attendant, patient, member

#### ⏰ **11 Disponibilidades** (horários dos profissionais)

- **Dr. João Silva**: Segunda a Sexta, 8h às 17h (Hospital Principal)
- **Dra. Maria Oliveira**: Terça a Quinta, 9h às 18h (Clínica Especializada)
- **Dr. Carlos Santos**: Segunda, Quarta, Sexta, 10h às 16h (Consultório)

#### 📅 **3 Agendamentos** de exemplo

#### 📋 **3 Atendimentos** de exemplo

#### 🔔 **3 Notificações** de exemplo

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

- **Swagger UI**: http://localhost:4000/docs

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
  "primaryRole": "owner" | "admin" | "professional" | "attendant" | "patient" | "member",
  "primaryOrganizationId": "string",
  "userOrganizations": [
    {
      "organizationId": "string",
      "role": "OrganizationRole",
      "organizationName": "string"
    }
  ],
  "iat": "timestamp",
  "exp": "timestamp"
}
```

### Tipos de Papel (OrganizationRole)

- **owner**: Proprietário da organização
- **admin**: Administrador da organização
- **professional**: Profissional de saúde
- **attendant**: Atendente
- **patient**: Paciente
- **member**: Membro geral

## 📊 Estrutura do Banco

### Modelo Users

- `id`: Identificador único
- `name`: Nome do usuário
- `email`: Email (único)
- `password`: Senha (hash)
- `cpf`: CPF (único)
- `phone`: Telefone
- `birthDate`: Data de nascimento
- `address`: Endereço completo

### Modelo PatientCID

- `id`: Identificador único
- `patientId`: ID do paciente
- `professionalId`: ID do profissional
- `organizationId`: ID da organização
- `cid`: Código CID
- `description`: Descrição opcional do CID
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

### Modelo Organization

- `id`: Identificador único
- `name`: Nome da organização
- `description`: Descrição
- `cnpj`: CNPJ (único)
- `address`: Endereço completo
- `phone`: Telefone
- `email`: Email
- `website`: Website
- `isActive`: Status ativo

### Modelo UserOrganization

- `id`: Identificador único
- `userId`: ID do usuário
- `organizationId`: ID da organização
- `role`: Papel na organização
- `isActive`: Status ativo
- `joinedAt`: Data de entrada
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

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
npm run db:push

# Seed
npm run seed
npm run seed:dev
npm run db:reset:seed
```

## 🔄 Rotas de Organização

### Rotas Públicas

- `GET /organizations` - Listar todas as organizações
- `GET /organizations/:id` - Buscar organização específica

### Rotas Protegidas

- `POST /organizations` - Criar organização
- `PUT /organizations/:id` - Atualizar organização
- `DELETE /organizations/:id` - Deletar organização
- `GET /user/organizations` - Buscar organizações do usuário logado
- `POST /user-organizations` - Adicionar usuário à organização
- `PUT /user-organizations/:id` - Atualizar papel do usuário
- `DELETE /user-organizations/:id` - Remover usuário da organização
- `GET /organizations/:organizationId/users` - Listar usuários da organização

## 🏥 Sistema de CID por Profissional

O sistema permite que cada profissional tenha um CID específico para cada paciente, com controle de acesso adequado.

### Rotas de PatientCID

- `POST /patient-cids` - Criar CID para um paciente (apenas profissionais)
- `PUT /patient-cids/:id` - Atualizar CID (apenas o profissional que criou)
- `DELETE /patient-cids/:id` - Deletar CID (apenas o profissional que criou)
- `GET /patient-cids/patient/:patientId` - Buscar CIDs de um paciente
- `GET /patient-cids/professional` - Buscar CIDs criados por um profissional
- `GET /patient-cids/:id` - Buscar um CID específico

### Regras de Acesso

- **Profissionais**: Podem criar, editar e deletar apenas os CIDs que criaram
- **Pacientes**: Podem visualizar todos os seus CIDs, mas não podem editá-los
- **Admins**: Podem visualizar todos os CIDs da organização

## 💡 Dicas de Uso

### Testando como Paciente

- Use qualquer email de paciente + senha `123456789`
- Exemplo: `carlos@email.com` / `123456789`

### Testando como Profissional

- Use email de profissional + senha `admin123`
- Exemplo: `admin@hospital.com` / `admin123`

### Testando como Atendente

- Use email de atendente + senha `123456789`
- Exemplo: `ana@hospital.com` / `123456789`

### Organizações de Teste

- **Hospital Principal**: CNPJ 12.345.678/0001-90
- **Clínica Especializada**: CNPJ 98.765.432/0001-10
- **Consultório Dr. Carlos**: CNPJ 11.222.333/0001-44

### Relacionamentos de Exemplo

- **Dr. João Silva** é owner do Hospital Principal
- **Ana Atendente** é admin do Hospital Principal
- **Carlos Santos** é patient em múltiplas organizações
- Cada usuário pode ter diferentes papéis em diferentes organizações
