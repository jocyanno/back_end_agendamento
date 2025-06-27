import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes (opcional)
  await prisma.users.deleteMany();
  console.log("🗑️ Dados existentes removidos");

  // Hash das senhas
  const defaultPassword = await bcrypt.hash("123456789", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // Criar usuário admin (doctor)
  const adminUser = await prisma.users.create({
    data: {
      name: "Dr. João Silva",
      email: "admin@hospital.com",
      password: adminPassword,
      cpf: "11122233344",
      register: "doctor",
      phone: "11999887766",
      birthDate: new Date("1980-05-15"),
      address: "Rua das Flores, 123",
      numberOfAddress: "123",
      complement: "Consultório 101",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      country: "Brasil"
    }
  });

  // Criar usuários pacientes
  const pacientes = [
    {
      name: "Maria Santos",
      email: "maria@email.com",
      cpf: "22233344455",
      phone: "11888777666",
      birthDate: new Date("1995-03-22"),
      address: "Av. Principal, 456",
      numberOfAddress: "456",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-890",
      country: "Brasil"
    },
    {
      name: "Pedro Oliveira",
      email: "pedro@email.com",
      cpf: "33344455566",
      phone: "11777666555",
      birthDate: new Date("1988-11-10"),
      address: "Rua das Palmeiras, 789",
      numberOfAddress: "789",
      complement: "Apto 204",
      city: "Rio de Janeiro",
      state: "RJ",
      zipCode: "20000-123",
      country: "Brasil"
    },
    {
      name: "Ana Costa",
      email: "ana@email.com",
      cpf: "44455566677",
      phone: "11666555444",
      birthDate: new Date("1992-07-18"),
      address: "Rua dos Girassóis, 321",
      numberOfAddress: "321",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30000-456",
      country: "Brasil"
    }
  ];

  const createdPacientes = [];
  for (const pacienteData of pacientes) {
    const paciente = await prisma.users.create({
      data: {
        ...pacienteData,
        password: defaultPassword,
        register: "patient"
      }
    });
    createdPacientes.push(paciente);
  }

  // Criar usuário responsável (parents)
  const responsavel = await prisma.users.create({
    data: {
      name: "Carlos Mendes",
      email: "carlos@email.com",
      password: defaultPassword,
      cpf: "55566677788",
      register: "parents",
      phone: "11555444333",
      birthDate: new Date("1975-12-05"),
      address: "Rua das Acácias, 654",
      numberOfAddress: "654",
      complement: "Casa 2",
      city: "Brasília",
      state: "DF",
      zipCode: "70000-789",
      country: "Brasil"
    }
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log(`📊 Usuários criados:`);
  console.log(`- 1 Admin (doctor): ${adminUser.email}`);
  console.log(`- ${createdPacientes.length} Pacientes (patient)`);
  console.log(`- 1 Responsável (parents): ${responsavel.email}`);
  console.log(`\n🔑 Senha padrão para todos: 123456789`);
  console.log(`🔑 Senha do admin: admin123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro durante o seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
