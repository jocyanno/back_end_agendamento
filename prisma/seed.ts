import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes (opcional)
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
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

  console.log(`👨‍⚕️ Admin criado: ${adminUser.email}`);

  // Criar outro médico
  const doctor2 = await prisma.users.create({
    data: {
      name: "Dra. Maria Oliveira",
      email: "maria.doctor@hospital.com",
      password: adminPassword,
      cpf: "22233344455",
      register: "doctor",
      phone: "11988776655",
      birthDate: new Date("1985-08-20"),
      address: "Av. Paulista, 1000",
      numberOfAddress: "1000",
      complement: "Sala 205",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      country: "Brasil"
    }
  });

  console.log(`👩‍⚕️ Médica criada: ${doctor2.email}`);

  // Criar atendente
  const attendant = await prisma.users.create({
    data: {
      name: "Ana Atendente",
      email: "ana@hospital.com",
      password: defaultPassword,
      cpf: "33344455566",
      register: "attendant",
      phone: "11977665544",
      birthDate: new Date("1990-03-10"),
      address: "Rua Augusta, 500",
      numberOfAddress: "500",
      city: "São Paulo",
      state: "SP",
      zipCode: "01212-000",
      country: "Brasil"
    }
  });

  console.log(`👩 Atendente criada: ${attendant.email}`);

  // Criar usuários pacientes (registrados pelo admin)
  const pacientes = [
    {
      name: "Carlos Santos",
      email: "carlos@email.com",
      cpf: "44455566677",
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
      cpf: "55566677788",
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
      name: "Fernanda Costa",
      email: "fernanda@email.com",
      cpf: "66677788899",
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
        register: "patient",
        registeredBy: adminUser.id // Registrado pelo admin
      }
    });
    createdPacientes.push(paciente);
  }

  // Criar usuário responsável (parents) - registrado pelo admin
  const responsavel = await prisma.users.create({
    data: {
      name: "Roberto Mendes",
      email: "roberto@email.com",
      password: defaultPassword,
      cpf: "77788899900",
      register: "parents",
      phone: "11555444333",
      birthDate: new Date("1975-12-05"),
      address: "Rua das Acácias, 654",
      numberOfAddress: "654",
      complement: "Casa 2",
      city: "Brasília",
      state: "DF",
      zipCode: "70000-789",
      country: "Brasil",
      registeredBy: adminUser.id // Registrado pelo admin
    }
  });

  // Criar disponibilidades para os médicos
  const availabilities = [
    // Dr. João Silva - Segunda a Sexta, 8h às 17h
    {
      doctorId: adminUser.id,
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      doctorId: adminUser.id,
      dayOfWeek: 2,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      doctorId: adminUser.id,
      dayOfWeek: 3,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      doctorId: adminUser.id,
      dayOfWeek: 4,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      doctorId: adminUser.id,
      dayOfWeek: 5,
      startTime: "08:00",
      endTime: "17:00"
    },

    // Dra. Maria Oliveira - Terça a Quinta, 9h às 18h
    {
      doctorId: doctor2.id,
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "18:00"
    },
    {
      doctorId: doctor2.id,
      dayOfWeek: 3,
      startTime: "09:00",
      endTime: "18:00"
    },
    { doctorId: doctor2.id, dayOfWeek: 4, startTime: "09:00", endTime: "18:00" }
  ];

  for (const availability of availabilities) {
    await prisma.availability.create({
      data: availability
    });
  }

  // Criar alguns agendamentos de exemplo
  const appointments = [
    {
      patientId: createdPacientes[0].id,
      doctorId: adminUser.id,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // Amanhã + 30min
      status: "scheduled" as const,
      notes: "Primeira consulta"
    },
    {
      patientId: createdPacientes[1].id,
      doctorId: doctor2.id,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Depois de amanhã
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "confirmed" as const,
      notes: "Consulta de retorno"
    }
  ];

  for (const appointment of appointments) {
    await prisma.appointment.create({
      data: appointment
    });
  }

  // Criar alguns atendimentos de exemplo
  const attendances = [
    {
      patientId: createdPacientes[0].id,
      doctorId: adminUser.id,
      description:
        "Consulta de rotina - Paciente apresentou sintomas leves de gripe"
    },
    {
      patientId: createdPacientes[1].id,
      doctorId: doctor2.id,
      description: "Avaliação inicial - Paciente com histórico de hipertensão"
    }
  ];

  for (const attendance of attendances) {
    await prisma.attendance.create({
      data: attendance
    });
  }

  // Criar algumas notificações de exemplo
  const notifications = [
    {
      userId: createdPacientes[0].id,
      type: "reminder",
      title: "Lembrete de Consulta",
      message: "Sua consulta está marcada para amanhã às 10:00"
    },
    {
      userId: createdPacientes[1].id,
      type: "confirmation",
      title: "Consulta Confirmada",
      message: "Sua consulta foi confirmada para depois de amanhã às 14:00"
    }
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification
    });
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log(`📊 Dados criados:`);
  console.log(`- 2 Médicos (doctor)`);
  console.log(`- 1 Atendente (attendant)`);
  console.log(`- ${createdPacientes.length} Pacientes (patient)`);
  console.log(`- 1 Responsável (parents)`);
  console.log(`- ${availabilities.length} Disponibilidades`);
  console.log(`- ${appointments.length} Agendamentos`);
  console.log(`- ${attendances.length} Atendimentos`);
  console.log(`- ${notifications.length} Notificações`);
  console.log(`\n🔑 Senhas:`);
  console.log(`- Pacientes/Atendente/Responsável: 123456789`);
  console.log(`- Médicos: admin123`);
  console.log(`\n👨‍⚕️ Médicos disponíveis:`);
  console.log(`- ${adminUser.email} (Dr. João Silva)`);
  console.log(`- ${doctor2.email} (Dra. Maria Oliveira)`);
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
