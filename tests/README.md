# Guia de Testes

Este projeto inclui uma suíte completa de testes unitários e end-to-end (E2E) para garantir a qualidade e confiabilidade do sistema de agendamento.

## Configuração do Ambiente de Teste

### 1. Banco de Dados de Teste

Crie um banco de dados PostgreSQL separado para testes:

```sql
CREATE DATABASE agendamento_test;
```

### 2. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente para teste (você pode criar um arquivo `.env.test`):

```bash
# Database de teste
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/agendamento_test"
DATABASE_URL="postgresql://username:password@localhost:5432/agendamento_test"

# JWT
JWT_SECRET="test-jwt-secret"

# Ambiente
NODE_ENV="test"
```

### 3. Configuração Inicial

Execute os comandos para preparar o ambiente de teste:

```bash
# Instalar dependências de teste
npm install --save-dev vitest @vitest/ui supertest @types/supertest

# Configurar banco de teste
npm run test:setup
```

## Executando os Testes

### Todos os Testes

```bash
npm test
```

### Apenas Testes Unitários

```bash
npm run test:unit
```

### Apenas Testes E2E

```bash
npm run test:e2e
```

### Testes com Interface Visual

```bash
npm run test:ui
```

### Testes com Cobertura

```bash
npm run test:coverage
```

### Executar uma vez (CI/CD)

```bash
npm run test:run
```

## Estrutura dos Testes

```
tests/
├── setup.ts                    # Configuração global dos testes
├── helpers/
│   ├── testHelpers.ts          # Funções auxiliares para criar dados de teste
│   └── testServer.ts           # Configuração do servidor de teste
├── unit/                       # Testes unitários
│   ├── usuarioService.test.ts  # Testes do serviço de usuário
│   └── appointmentService.test.ts # Testes do serviço de agendamento
└── e2e/                        # Testes end-to-end
    ├── usuario.e2e.test.ts     # Testes das rotas de usuário
    └── appointment.e2e.test.ts # Testes das rotas de agendamento
```

## Características dos Testes

### Testes Unitários

- Testam funções individuais dos serviços
- Usam mocks para dependências externas (Google Calendar, email)
- Isolados e rápidos
- Cobertura de casos de sucesso e erro

### Testes E2E

- Testam o fluxo completo das APIs
- Usam servidor real do Fastify
- Testam autenticação, autorização e validação
- Simulam cenários reais de uso

### Recursos dos Testes

#### Banco de Dados Temporário

- Cada teste usa um banco limpo
- Dados são limpos automaticamente entre testes
- Isolamento completo entre testes

#### Mocks Inteligentes

- Google Calendar API mockado
- Serviço de email mockado
- JWT simplificado para testes

#### Helpers de Teste

- Criação fácil de usuários, médicos e pacientes
- Geração automática de dados únicos
- Funções para autenticação e autorização

## Casos de Teste Cobertos

### Usuários

- ✅ Criação de usuário
- ✅ Login e autenticação
- ✅ Atualização de dados
- ✅ Prevenção de duplicatas
- ✅ Validações de entrada
- ✅ Permissões de admin

### Agendamentos

- ✅ Criação de agendamento
- ✅ Limite de 1 agendamento por semana
- ✅ Verificação de conflitos de horário
- ✅ Geração de horários disponíveis
- ✅ Cancelamento com regras de negócio
- ✅ Atualização de status
- ✅ Permissões por tipo de usuário

### Disponibilidade

- ✅ Configuração de horários pelo médico
- ✅ Prevenção de sobreposição
- ✅ Consulta de disponibilidade

## Executando Testes Específicos

### Por arquivo

```bash
npx vitest tests/unit/usuarioService.test.ts
```

### Por padrão

```bash
npx vitest --grep "should create appointment"
```

### Por tag/describe

```bash
npx vitest --grep "AppointmentService"
```

## CI/CD

Para pipelines de CI/CD, use:

```bash
# Preparar ambiente
npm run test:setup

# Executar todos os testes
npm run test:run

# Com cobertura
npm run test:coverage
```

## Troubleshooting

### Problema: Banco de dados não conecta

- Verifique se PostgreSQL está rodando
- Confirme as credenciais no DATABASE_URL
- Execute `npm run test:setup` novamente

### Problema: Testes lentos

- Use `npm run test:unit` para apenas testes unitários
- Configure um SSD para o banco de teste
- Considere usar SQLite para testes mais rápidos

### Problema: Testes falhando esporadicamente

- Verifique se há limpeza adequada entre testes
- Confirme se não há dependências entre testes
- Use `--reporter=verbose` para mais detalhes

## Contribuindo

Ao adicionar novos recursos:

1. **Sempre adicione testes unitários** para novos serviços
2. **Adicione testes E2E** para novas rotas
3. **Mantenha cobertura acima de 80%**
4. **Use os helpers existentes** para consistência
5. **Documente casos de teste complexos**

## Exemplo de Teste

```typescript
import { describe, it, expect } from "vitest";
import { createTestUser, getRandomEmail } from "../helpers/testHelpers";

describe("Exemplo", () => {
  it("should do something", async () => {
    // Arrange
    const user = await createTestUser({
      email: getRandomEmail(),
      password: "password123",
      cpf: "12345678901"
    });

    // Act
    const result = await someFunction(user.id);

    // Assert
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
```
