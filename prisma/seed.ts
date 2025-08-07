import { PrismaClient, OrganizationRole, Users } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes (opcional)
  await prisma.appointment.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.userOrganization.deleteMany();
  await prisma.users.deleteMany();
  await prisma.organization.deleteMany();
  console.log("🗑️ Dados existentes removidos");

  // Hash das senhas
  const defaultPassword = await bcrypt.hash("123456789", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  // Criar organizações
  const hospitalPrincipal = await prisma.organization.create({
    data: {
      name: "Hospital Principal",
      description: "Hospital de referência em São Paulo",
      cnpj: "12.345.678/0001-90",
      address: "Av. Paulista, 1000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      country: "Brasil",
      phone: "(11) 3000-0000",
      email: "contato@hospitalprincipal.com",
      website: "https://hospitalprincipal.com"
    }
  });

  const clinicaEspecializada = await prisma.organization.create({
    data: {
      name: "Clínica Especializada",
      description: "Clínica especializada em cardiologia",
      cnpj: "98.765.432/0001-10",
      address: "Rua Augusta, 500",
      city: "São Paulo",
      state: "SP",
      zipCode: "01212-000",
      country: "Brasil",
      phone: "(11) 4000-0000",
      email: "contato@clinicaespecializada.com",
      website: "https://clinicaespecializada.com"
    }
  });

  const consultorioMedico = await prisma.organization.create({
    data: {
      name: "Consultório Dr. Carlos",
      description: "Consultório particular",
      cnpj: "11.222.333/0001-44",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      country: "Brasil",
      phone: "(11) 5000-0000",
      email: "contato@consultoriodrcarlos.com",
      website: "https://consultoriodrcarlos.com"
    }
  });

  console.log(
    `🏥 Organizações criadas: ${hospitalPrincipal.name}, ${clinicaEspecializada.name}, ${consultorioMedico.name}`
  );

  // Criar usuários médicos
  const adminUser = await prisma.users.create({
    data: {
      name: "Dr. João Silva",
      email: "admin@hospital.com",
      password: adminPassword,
      cpf: "11122233344",
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

  const doctor2 = await prisma.users.create({
    data: {
      name: "Dra. Maria Oliveira",
      email: "maria.doctor@hospital.com",
      password: adminPassword,
      cpf: "22233344455",
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

  const doctor3 = await prisma.users.create({
    data: {
      name: "Dr. Carlos Santos",
      email: "carlos.doctor@consultorio.com",
      password: adminPassword,
      cpf: "33344455566",
      phone: "11977665544",
      birthDate: new Date("1975-12-10"),
      address: "Rua das Palmeiras, 789",
      numberOfAddress: "789",
      complement: "Consultório 3",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-890",
      country: "Brasil"
    }
  });

  console.log(
    `👨‍⚕️ Profissionais criados: ${adminUser.email}, ${doctor2.email}, ${doctor3.email}`
  );

  // Criar atendentes
  const attendant1 = await prisma.users.create({
    data: {
      name: "Ana Atendente",
      email: "ana@hospital.com",
      password: defaultPassword,
      cpf: "44455566677",
      phone: "11966554433",
      birthDate: new Date("1990-03-10"),
      address: "Rua Augusta, 500",
      numberOfAddress: "500",
      city: "São Paulo",
      state: "SP",
      zipCode: "01212-000",
      country: "Brasil"
    }
  });

  const attendant2 = await prisma.users.create({
    data: {
      name: "Beatriz Atendente",
      email: "beatriz@clinica.com",
      password: defaultPassword,
      cpf: "55566677788",
      phone: "11955443322",
      birthDate: new Date("1992-07-15"),
      address: "Av. Brigadeiro Faria Lima, 2000",
      numberOfAddress: "2000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01452-002",
      country: "Brasil"
    }
  });

  console.log(
    `👩 Atendentes criadas: ${attendant1.email}, ${attendant2.email}`
  );

  // Criar usuários pacientes
  const pacientes = [
    {
      name: "Carlos Santos",
      email: "carlos@email.com",
      cpf: "66677788899",
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
      cpf: "77788899900",
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
      cpf: "88899900011",
      phone: "11666555444",
      birthDate: new Date("1992-07-18"),
      address: "Rua dos Girassóis, 321",
      numberOfAddress: "321",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30000-456",
      country: "Brasil"
    },
    {
      name: "Roberto Mendes",
      email: "roberto@email.com",
      cpf: "99900011122",
      phone: "11555444333",
      birthDate: new Date("1975-12-05"),
      address: "Rua das Acácias, 654",
      numberOfAddress: "654",
      complement: "Casa 2",
      city: "Brasília",
      state: "DF",
      zipCode: "70000-789",
      country: "Brasil"
    },
    {
      name: "Lucia Silva",
      email: "lucia@email.com",
      cpf: "00011122233",
      phone: "11444333222",
      birthDate: new Date("1980-09-25"),
      address: "Rua das Margaridas, 111",
      numberOfAddress: "111",
      city: "Curitiba",
      state: "PR",
      zipCode: "80000-123",
      country: "Brasil"
    }
  ];

  const createdPacientes: Users[] = [];
  for (const pacienteData of pacientes) {
    const paciente = await prisma.users.create({
      data: {
        ...pacienteData,
        password: defaultPassword
      }
    });
    createdPacientes.push(paciente);
  }

  console.log(`👥 ${createdPacientes.length} Pacientes criados`);

  // Criar relacionamentos UserOrganization
  const userOrganizations = [
    // Hospital Principal
    {
      userId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: attendant1.id,
      organizationId: hospitalPrincipal.id,
      role: "admin" as OrganizationRole
    },
    {
      userId: createdPacientes[0].id,
      organizationId: hospitalPrincipal.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[1].id,
      organizationId: hospitalPrincipal.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[3].id,
      organizationId: hospitalPrincipal.id,
      role: "member" as OrganizationRole
    },

    // Clínica Especializada
    {
      userId: doctor2.id,
      organizationId: clinicaEspecializada.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: attendant2.id,
      organizationId: clinicaEspecializada.id,
      role: "admin" as OrganizationRole
    },
    {
      userId: createdPacientes[2].id,
      organizationId: clinicaEspecializada.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[4].id,
      organizationId: clinicaEspecializada.id,
      role: "patient" as OrganizationRole
    },

    // Consultório Dr. Carlos
    {
      userId: doctor3.id,
      organizationId: consultorioMedico.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: createdPacientes[0].id,
      organizationId: consultorioMedico.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[1].id,
      organizationId: consultorioMedico.id,
      role: "patient" as OrganizationRole
    }
  ];

  for (const userOrg of userOrganizations) {
    await prisma.userOrganization.create({
      data: userOrg
    });
  }

  console.log(
    `🔗 ${userOrganizations.length} Relacionamentos UserOrganization criados`
  );

  // Criar disponibilidades para os médicos
  const availabilities = [
    // Dr. João Silva - Hospital Principal - Segunda a Sexta, 8h às 17h
    {
      professionalId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      dayOfWeek: 2,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      dayOfWeek: 3,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      dayOfWeek: 4,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      dayOfWeek: 5,
      startTime: "08:00",
      endTime: "17:00"
    },

    // Dra. Maria Oliveira - Clínica Especializada - Terça a Quinta, 9h às 18h
    {
      professionalId: doctor2.id,
      organizationId: clinicaEspecializada.id,
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "18:00"
    },
    {
      professionalId: doctor2.id,
      organizationId: clinicaEspecializada.id,
      dayOfWeek: 3,
      startTime: "09:00",
      endTime: "18:00"
    },
    {
      professionalId: doctor2.id,
      organizationId: clinicaEspecializada.id,
      dayOfWeek: 4,
      startTime: "09:00",
      endTime: "18:00"
    },

    // Dr. Carlos Santos - Consultório - Segunda, Quarta, Sexta, 10h às 16h
    {
      professionalId: doctor3.id,
      organizationId: consultorioMedico.id,
      dayOfWeek: 1,
      startTime: "10:00",
      endTime: "16:00"
    },
    {
      professionalId: doctor3.id,
      organizationId: consultorioMedico.id,
      dayOfWeek: 3,
      startTime: "10:00",
      endTime: "16:00"
    },
    {
      professionalId: doctor3.id,
      organizationId: consultorioMedico.id,
      dayOfWeek: 5,
      startTime: "10:00",
      endTime: "16:00"
    }
  ];

  for (const availability of availabilities) {
    await prisma.availability.create({
      data: availability
    });
  }

  console.log(`⏰ ${availabilities.length} Disponibilidades criadas`);

  // Criar alguns agendamentos de exemplo
  const appointments = [
    {
      patientId: createdPacientes[0].id,
      professionalId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // Amanhã + 30min
      status: "scheduled" as const,
      notes: "Primeira consulta"
    },
    {
      patientId: createdPacientes[2].id,
      professionalId: doctor2.id,
      organizationId: clinicaEspecializada.id,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Depois de amanhã
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "confirmed" as const,
      notes: "Consulta de retorno"
    },
    {
      patientId: createdPacientes[1].id,
      professionalId: doctor3.id,
      organizationId: consultorioMedico.id,
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Em 3 dias
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "scheduled" as const,
      notes: "Consulta de rotina"
    }
  ];

  for (const appointment of appointments) {
    await prisma.appointment.create({
      data: appointment
    });
  }

  console.log(`📅 ${appointments.length} Agendamentos criados`);

  // Criar alguns atendimentos de exemplo
  const attendances = [
    {
      patientId: createdPacientes[0].id,
      professionalId: adminUser.id,
      organizationId: hospitalPrincipal.id,
      description:
        "Consulta de rotina - Paciente apresentou sintomas leves de gripe"
    },
    {
      patientId: createdPacientes[2].id,
      professionalId: doctor2.id,
      organizationId: clinicaEspecializada.id,
      description: "Avaliação inicial - Paciente com histórico de hipertensão"
    },
    {
      patientId: createdPacientes[1].id,
      professionalId: doctor3.id,
      organizationId: consultorioMedico.id,
      description: "Consulta de acompanhamento - Paciente em tratamento"
    }
  ];

  for (const attendance of attendances) {
    await prisma.attendance.create({
      data: attendance
    });
  }

  console.log(`📋 ${attendances.length} Atendimentos criados`);

  // Criar algumas notificações de exemplo
  const notifications = [
    {
      userId: createdPacientes[0].id,
      type: "reminder",
      title: "Lembrete de Consulta",
      message: "Sua consulta está marcada para amanhã às 10:00"
    },
    {
      userId: createdPacientes[2].id,
      type: "confirmation",
      title: "Consulta Confirmada",
      message: "Sua consulta foi confirmada para depois de amanhã às 14:00"
    },
    {
      userId: createdPacientes[1].id,
      type: "reminder",
      title: "Lembrete de Consulta",
      message: "Sua consulta está marcada para em 3 dias às 15:00"
    }
  ];

  for (const notification of notifications) {
    await prisma.notification.create({
      data: notification
    });
  }

  console.log(`🔔 ${notifications.length} Notificações criadas`);

  console.log("\n✅ Seed concluído com sucesso!");
  console.log(`📊 Dados criados:`);
  console.log(`- ${3} Organizações`);
  console.log(`- ${3} Profissionais`);
  console.log(`- ${2} Atendentes`);
  console.log(`- ${createdPacientes.length} Pacientes`);
  console.log(`- ${userOrganizations.length} Relacionamentos UserOrganization`);
  console.log(`- ${availabilities.length} Disponibilidades`);
  console.log(`- ${appointments.length} Agendamentos`);
  console.log(`- ${attendances.length} Atendimentos`);
  console.log(`- ${notifications.length} Notificações`);

  console.log(`\n🔑 Senhas:`);
  console.log(`- Pacientes/Atendentes: 123456789`);
  console.log(`- Profissionais: admin123`);

  console.log(`\n🏥 Organizações:`);
  console.log(`- ${hospitalPrincipal.name} (CNPJ: ${hospitalPrincipal.cnpj})`);
  console.log(
    `- ${clinicaEspecializada.name} (CNPJ: ${clinicaEspecializada.cnpj})`
  );
  console.log(`- ${consultorioMedico.name} (CNPJ: ${consultorioMedico.cnpj})`);

  console.log(`\n👨‍⚕️ Profissionais disponíveis:`);
  console.log(
    `- ${adminUser.email} (Dr. João Silva) - ${hospitalPrincipal.name}`
  );
  console.log(
    `- ${doctor2.email} (Dra. Maria Oliveira) - ${clinicaEspecializada.name}`
  );
  console.log(
    `- ${doctor3.email} (Dr. Carlos Santos) - ${consultorioMedico.name}`
  );

  console.log(`\n👥 Usuários de teste:`);
  console.log(
    `- Pacientes: ${createdPacientes.map((p) => p.email).join(", ")}`
  );
  console.log(`- Atendentes: ${attendant1.email}, ${attendant2.email}`);

  console.log(`\n💡 Dicas de uso:`);
  console.log(
    `- Use qualquer email de paciente + senha 123456789 para testar como paciente`
  );
  console.log(
    `- Use email de profissional + senha admin123 para testar como profissional`
  );
  console.log(
    `- Use email de atendente + senha 123456789 para testar como atendente`
  );
  console.log(
    `- Cada usuário pode ter diferentes papéis em diferentes organizações`
  );
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
