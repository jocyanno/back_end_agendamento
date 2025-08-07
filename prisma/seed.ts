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

  const hospitalCardiaco = await prisma.organization.create({
    data: {
      name: "Hospital Cardíaco",
      description: "Hospital especializado em cardiologia",
      cnpj: "22.333.444/0001-55",
      address: "Av. Brigadeiro Faria Lima, 2000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01452-002",
      country: "Brasil",
      phone: "(11) 6000-0000",
      email: "contato@hospitalcardiaco.com",
      website: "https://hospitalcardiaco.com"
    }
  });

  const clinicaOrtopedica = await prisma.organization.create({
    data: {
      name: "Clínica Ortopédica",
      description: "Clínica especializada em ortopedia",
      cnpj: "33.444.555/0001-66",
      address: "Rua Oscar Freire, 300",
      city: "São Paulo",
      state: "SP",
      zipCode: "01426-001",
      country: "Brasil",
      phone: "(11) 7000-0000",
      email: "contato@clinicaortopedica.com",
      website: "https://clinicaortopedica.com"
    }
  });

  const consultorioPsicologia = await prisma.organization.create({
    data: {
      name: "Consultório Psicologia",
      description: "Consultório de psicologia",
      cnpj: "44.555.666/0001-77",
      address: "Rua Haddock Lobo, 400",
      city: "São Paulo",
      state: "SP",
      zipCode: "01414-001",
      country: "Brasil",
      phone: "(11) 8000-0000",
      email: "contato@consultoriopsicologia.com",
      website: "https://consultoriopsicologia.com"
    }
  });

  const hospitalPediatrico = await prisma.organization.create({
    data: {
      name: "Hospital Pediátrico",
      description: "Hospital especializado em pediatria",
      cnpj: "55.666.777/0001-88",
      address: "Av. Jabaquara, 1500",
      city: "São Paulo",
      state: "SP",
      zipCode: "04046-300",
      country: "Brasil",
      phone: "(11) 9000-0000",
      email: "contato@hospitalpediatrico.com",
      website: "https://hospitalpediatrico.com"
    }
  });

  const clinicaDermatologica = await prisma.organization.create({
    data: {
      name: "Clínica Dermatológica",
      description: "Clínica especializada em dermatologia",
      cnpj: "66.777.888/0001-99",
      address: "Rua Teodoro Sampaio, 600",
      city: "São Paulo",
      state: "SP",
      zipCode: "05406-120",
      country: "Brasil",
      phone: "(11) 1000-0000",
      email: "contato@clinicadermatologica.com",
      website: "https://clinicadermatologica.com"
    }
  });

  const consultorioNutricao = await prisma.organization.create({
    data: {
      name: "Consultório Nutrição",
      description: "Consultório de nutrição",
      cnpj: "77.888.999/0001-00",
      address: "Rua Cardeal Arcoverde, 700",
      city: "São Paulo",
      state: "SP",
      zipCode: "05407-001",
      country: "Brasil",
      phone: "(11) 1100-0000",
      email: "contato@consultorionutricao.com",
      website: "https://consultorionutricao.com"
    }
  });

  console.log(
    `🏥 Organizações criadas: ${hospitalPrincipal.name}, ${clinicaEspecializada.name}, ${consultorioMedico.name}, ${hospitalCardiaco.name}, ${clinicaOrtopedica.name}, ${consultorioPsicologia.name}, ${hospitalPediatrico.name}, ${clinicaDermatologica.name}, ${consultorioNutricao.name}`
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

  const doctor4 = await prisma.users.create({
    data: {
      name: "Dr. Roberto Cardoso",
      email: "roberto.doctor@cardiaco.com",
      password: adminPassword,
      cpf: "44455566677",
      phone: "11966554433",
      birthDate: new Date("1978-03-15"),
      address: "Av. Brigadeiro Faria Lima, 2000",
      numberOfAddress: "2000",
      complement: "Sala 301",
      city: "São Paulo",
      state: "SP",
      zipCode: "01452-002",
      country: "Brasil"
    }
  });

  const doctor5 = await prisma.users.create({
    data: {
      name: "Dra. Ana Ferreira",
      email: "ana.doctor@ortopedica.com",
      password: adminPassword,
      cpf: "55566677788",
      phone: "11955443322",
      birthDate: new Date("1982-07-22"),
      address: "Rua Oscar Freire, 300",
      numberOfAddress: "300",
      complement: "Consultório 2",
      city: "São Paulo",
      state: "SP",
      zipCode: "01426-001",
      country: "Brasil"
    }
  });

  const doctor6 = await prisma.users.create({
    data: {
      name: "Dr. Paulo Mendes",
      email: "paulo.doctor@psicologia.com",
      password: adminPassword,
      cpf: "66677788899",
      phone: "11944332211",
      birthDate: new Date("1987-11-08"),
      address: "Rua Haddock Lobo, 400",
      numberOfAddress: "400",
      complement: "Sala 102",
      city: "São Paulo",
      state: "SP",
      zipCode: "01414-001",
      country: "Brasil"
    }
  });

  const doctor7 = await prisma.users.create({
    data: {
      name: "Dra. Fernanda Lima",
      email: "fernanda.doctor@pediatrico.com",
      password: adminPassword,
      cpf: "77788899900",
      phone: "11933221100",
      birthDate: new Date("1983-04-12"),
      address: "Av. Jabaquara, 1500",
      numberOfAddress: "1500",
      complement: "Sala 401",
      city: "São Paulo",
      state: "SP",
      zipCode: "04046-300",
      country: "Brasil"
    }
  });

  const doctor8 = await prisma.users.create({
    data: {
      name: "Dr. Lucas Costa",
      email: "lucas.doctor@dermatologica.com",
      password: adminPassword,
      cpf: "88899900011",
      phone: "11922110099",
      birthDate: new Date("1989-09-25"),
      address: "Rua Teodoro Sampaio, 600",
      numberOfAddress: "600",
      complement: "Consultório 5",
      city: "São Paulo",
      state: "SP",
      zipCode: "05406-120",
      country: "Brasil"
    }
  });

  const doctor9 = await prisma.users.create({
    data: {
      name: "Dra. Juliana Alves",
      email: "juliana.doctor@nutricao.com",
      password: adminPassword,
      cpf: "99900011122",
      phone: "11911009988",
      birthDate: new Date("1986-12-03"),
      address: "Rua Cardeal Arcoverde, 700",
      numberOfAddress: "700",
      complement: "Sala 201",
      city: "São Paulo",
      state: "SP",
      zipCode: "05407-001",
      country: "Brasil"
    }
  });

  console.log(
    `👨‍⚕️ Profissionais criados: ${adminUser.email}, ${doctor2.email}, ${doctor3.email}, ${doctor4.email}, ${doctor5.email}, ${doctor6.email}, ${doctor7.email}, ${doctor8.email}, ${doctor9.email}`
  );

  // Criar atendentes
  const attendant1 = await prisma.users.create({
    data: {
      name: "Ana Atendente",
      email: "ana@hospital.com",
      password: defaultPassword,
      cpf: "11111111111",
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
      cpf: "22222222222",
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

  const attendant3 = await prisma.users.create({
    data: {
      name: "Carla Atendente",
      email: "carla@cardiaco.com",
      password: defaultPassword,
      cpf: "33333333333",
      phone: "11944332211",
      birthDate: new Date("1988-11-20"),
      address: "Rua Oscar Freire, 300",
      numberOfAddress: "300",
      city: "São Paulo",
      state: "SP",
      zipCode: "01426-001",
      country: "Brasil"
    }
  });

  const attendant4 = await prisma.users.create({
    data: {
      name: "Daniela Atendente",
      email: "daniela@ortopedica.com",
      password: defaultPassword,
      cpf: "44444444444",
      phone: "11933221100",
      birthDate: new Date("1991-05-14"),
      address: "Rua Haddock Lobo, 400",
      numberOfAddress: "400",
      city: "São Paulo",
      state: "SP",
      zipCode: "01414-001",
      country: "Brasil"
    }
  });

  const attendant5 = await prisma.users.create({
    data: {
      name: "Elena Atendente",
      email: "elena@pediatrico.com",
      password: defaultPassword,
      cpf: "55555555555",
      phone: "11922110099",
      birthDate: new Date("1993-09-08"),
      address: "Av. Jabaquara, 1500",
      numberOfAddress: "1500",
      city: "São Paulo",
      state: "SP",
      zipCode: "04046-300",
      country: "Brasil"
    }
  });

  const attendant6 = await prisma.users.create({
    data: {
      name: "Fabiana Atendente",
      email: "fabiana@dermatologica.com",
      password: defaultPassword,
      cpf: "66666666666",
      phone: "11911009988",
      birthDate: new Date("1989-12-03"),
      address: "Rua Teodoro Sampaio, 600",
      numberOfAddress: "600",
      city: "São Paulo",
      state: "SP",
      zipCode: "05406-120",
      country: "Brasil"
    }
  });

  console.log(
    `👩 Atendentes criadas: ${attendant1.email}, ${attendant2.email}, ${attendant3.email}, ${attendant4.email}, ${attendant5.email}, ${attendant6.email}`
  );

  // Criar usuários pacientes
  const pacientes = [
    {
      name: "Carlos Santos",
      email: "carlos@email.com",
      cpf: "12345678900",
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
      cpf: "23456789001",
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
      cpf: "34567890012",
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
      cpf: "45678900123",
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
      cpf: "56789001234",
      phone: "11444333222",
      birthDate: new Date("1980-09-25"),
      address: "Rua das Margaridas, 111",
      numberOfAddress: "111",
      city: "Curitiba",
      state: "PR",
      zipCode: "80000-123",
      country: "Brasil"
    },
    {
      name: "Marcos Pereira",
      email: "marcos@email.com",
      cpf: "77777777777",
      phone: "11333222111",
      birthDate: new Date("1987-04-15"),
      address: "Av. Santos Dumont, 222",
      numberOfAddress: "222",
      complement: "Apto 305",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
      country: "Brasil"
    },
    {
      name: "Amanda Rodrigues",
      email: "amanda@email.com",
      cpf: "88888888888",
      phone: "11222111000",
      birthDate: new Date("1993-08-30"),
      address: "Rua das Orquídeas, 333",
      numberOfAddress: "333",
      city: "Porto Alegre",
      state: "RS",
      zipCode: "90000-456",
      country: "Brasil"
    },
    {
      name: "Ricardo Almeida",
      email: "ricardo@email.com",
      cpf: "99999999999",
      phone: "11111000999",
      birthDate: new Date("1982-01-12"),
      address: "Rua das Tulipas, 444",
      numberOfAddress: "444",
      complement: "Casa 5",
      city: "Salvador",
      state: "BA",
      zipCode: "40000-789",
      country: "Brasil"
    },
    {
      name: "Patricia Lima",
      email: "patricia@email.com",
      cpf: "00000000000",
      phone: "11000999888",
      birthDate: new Date("1990-06-20"),
      address: "Av. das Palmeiras, 555",
      numberOfAddress: "555",
      city: "Recife",
      state: "PE",
      zipCode: "50000-123",
      country: "Brasil"
    },
    {
      name: "Thiago Martins",
      email: "thiago@email.com",
      cpf: "12345678901",
      phone: "11999888777",
      birthDate: new Date("1985-10-08"),
      address: "Rua das Violetas, 666",
      numberOfAddress: "666",
      complement: "Apto 101",
      city: "Fortaleza",
      state: "CE",
      zipCode: "60000-456",
      country: "Brasil"
    },
    {
      name: "Camila Souza",
      email: "camila@email.com",
      cpf: "23456789012",
      phone: "11888777666",
      birthDate: new Date("1998-02-14"),
      address: "Av. das Rosas, 777",
      numberOfAddress: "777",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30000-789",
      country: "Brasil"
    },
    {
      name: "Diego Costa",
      email: "diego@email.com",
      cpf: "34567890123",
      phone: "11777666555",
      birthDate: new Date("1983-12-03"),
      address: "Rua dos Cravos, 888",
      numberOfAddress: "888",
      complement: "Casa 3",
      city: "Brasília",
      state: "DF",
      zipCode: "70000-123",
      country: "Brasil"
    },
    {
      name: "Vanessa Santos",
      email: "vanessa@email.com",
      cpf: "45678901234",
      phone: "11666555444",
      birthDate: new Date("1991-05-25"),
      address: "Av. das Margaridas, 999",
      numberOfAddress: "999",
      city: "Curitiba",
      state: "PR",
      zipCode: "80000-456",
      country: "Brasil"
    },
    {
      name: "Leonardo Oliveira",
      email: "leonardo@email.com",
      cpf: "56789012345",
      phone: "11555444333",
      birthDate: new Date("1989-07-18"),
      address: "Rua das Azaleias, 1000",
      numberOfAddress: "1000",
      complement: "Apto 502",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-890",
      country: "Brasil"
    },
    {
      name: "Isabela Ferreira",
      email: "isabela@email.com",
      cpf: "67890123456",
      phone: "11444333222",
      birthDate: new Date("1996-11-30"),
      address: "Av. das Hortênsias, 1111",
      numberOfAddress: "1111",
      city: "Rio de Janeiro",
      state: "RJ",
      zipCode: "20000-789",
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
    },

    // Hospital Cardíaco
    {
      userId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: attendant3.id,
      organizationId: hospitalCardiaco.id,
      role: "admin" as OrganizationRole
    },
    {
      userId: createdPacientes[5].id,
      organizationId: hospitalCardiaco.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[6].id,
      organizationId: hospitalCardiaco.id,
      role: "patient" as OrganizationRole
    },

    // Clínica Ortopédica
    {
      userId: doctor5.id,
      organizationId: clinicaOrtopedica.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: attendant4.id,
      organizationId: clinicaOrtopedica.id,
      role: "admin" as OrganizationRole
    },
    {
      userId: createdPacientes[7].id,
      organizationId: clinicaOrtopedica.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[8].id,
      organizationId: clinicaOrtopedica.id,
      role: "patient" as OrganizationRole
    },

    // Consultório Psicologia
    {
      userId: doctor6.id,
      organizationId: consultorioPsicologia.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: createdPacientes[9].id,
      organizationId: consultorioPsicologia.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[10].id,
      organizationId: consultorioPsicologia.id,
      role: "patient" as OrganizationRole
    },

    // Hospital Pediátrico
    {
      userId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: attendant5.id,
      organizationId: hospitalPediatrico.id,
      role: "admin" as OrganizationRole
    },
    {
      userId: createdPacientes[11].id,
      organizationId: hospitalPediatrico.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[12].id,
      organizationId: hospitalPediatrico.id,
      role: "patient" as OrganizationRole
    },

    // Clínica Dermatológica
    {
      userId: doctor8.id,
      organizationId: clinicaDermatologica.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: attendant6.id,
      organizationId: clinicaDermatologica.id,
      role: "admin" as OrganizationRole
    },
    {
      userId: createdPacientes[13].id,
      organizationId: clinicaDermatologica.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[14].id,
      organizationId: clinicaDermatologica.id,
      role: "patient" as OrganizationRole
    },

    // Consultório Nutrição
    {
      userId: doctor9.id,
      organizationId: consultorioNutricao.id,
      role: "owner" as OrganizationRole
    },
    {
      userId: createdPacientes[0].id,
      organizationId: consultorioNutricao.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[1].id,
      organizationId: consultorioNutricao.id,
      role: "patient" as OrganizationRole
    },

    // Relacionamentos adicionais para demonstrar múltiplas organizações
    {
      userId: createdPacientes[2].id,
      organizationId: hospitalCardiaco.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[3].id,
      organizationId: clinicaOrtopedica.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[4].id,
      organizationId: consultorioPsicologia.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[5].id,
      organizationId: hospitalPediatrico.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[6].id,
      organizationId: clinicaDermatologica.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[7].id,
      organizationId: consultorioNutricao.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[8].id,
      organizationId: hospitalPrincipal.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[9].id,
      organizationId: clinicaEspecializada.id,
      role: "patient" as OrganizationRole
    },
    {
      userId: createdPacientes[10].id,
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
    },

    // Dr. Roberto Cardoso - Hospital Cardíaco - Segunda a Sexta, 7h às 16h
    {
      professionalId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      dayOfWeek: 1,
      startTime: "07:00",
      endTime: "16:00"
    },
    {
      professionalId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      dayOfWeek: 2,
      startTime: "07:00",
      endTime: "16:00"
    },
    {
      professionalId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      dayOfWeek: 3,
      startTime: "07:00",
      endTime: "16:00"
    },
    {
      professionalId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      dayOfWeek: 4,
      startTime: "07:00",
      endTime: "16:00"
    },
    {
      professionalId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      dayOfWeek: 5,
      startTime: "07:00",
      endTime: "16:00"
    },

    // Dra. Ana Ferreira - Clínica Ortopédica - Terça a Sexta, 8h às 18h
    {
      professionalId: doctor5.id,
      organizationId: clinicaOrtopedica.id,
      dayOfWeek: 2,
      startTime: "08:00",
      endTime: "18:00"
    },
    {
      professionalId: doctor5.id,
      organizationId: clinicaOrtopedica.id,
      dayOfWeek: 3,
      startTime: "08:00",
      endTime: "18:00"
    },
    {
      professionalId: doctor5.id,
      organizationId: clinicaOrtopedica.id,
      dayOfWeek: 4,
      startTime: "08:00",
      endTime: "18:00"
    },
    {
      professionalId: doctor5.id,
      organizationId: clinicaOrtopedica.id,
      dayOfWeek: 5,
      startTime: "08:00",
      endTime: "18:00"
    },

    // Dr. Paulo Mendes - Consultório Psicologia - Segunda, Quarta, Sexta, 14h às 20h
    {
      professionalId: doctor6.id,
      organizationId: consultorioPsicologia.id,
      dayOfWeek: 1,
      startTime: "14:00",
      endTime: "20:00"
    },
    {
      professionalId: doctor6.id,
      organizationId: consultorioPsicologia.id,
      dayOfWeek: 3,
      startTime: "14:00",
      endTime: "20:00"
    },
    {
      professionalId: doctor6.id,
      organizationId: consultorioPsicologia.id,
      dayOfWeek: 5,
      startTime: "14:00",
      endTime: "20:00"
    },

    // Dra. Fernanda Lima - Hospital Pediátrico - Segunda a Sexta, 8h às 17h
    {
      professionalId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      dayOfWeek: 1,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      dayOfWeek: 2,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      dayOfWeek: 3,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      dayOfWeek: 4,
      startTime: "08:00",
      endTime: "17:00"
    },
    {
      professionalId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      dayOfWeek: 5,
      startTime: "08:00",
      endTime: "17:00"
    },

    // Dr. Lucas Costa - Clínica Dermatológica - Terça a Quinta, 9h às 19h
    {
      professionalId: doctor8.id,
      organizationId: clinicaDermatologica.id,
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "19:00"
    },
    {
      professionalId: doctor8.id,
      organizationId: clinicaDermatologica.id,
      dayOfWeek: 3,
      startTime: "09:00",
      endTime: "19:00"
    },
    {
      professionalId: doctor8.id,
      organizationId: clinicaDermatologica.id,
      dayOfWeek: 4,
      startTime: "09:00",
      endTime: "19:00"
    },

    // Dra. Juliana Alves - Consultório Nutrição - Segunda, Quarta, Sexta, 10h às 18h
    {
      professionalId: doctor9.id,
      organizationId: consultorioNutricao.id,
      dayOfWeek: 1,
      startTime: "10:00",
      endTime: "18:00"
    },
    {
      professionalId: doctor9.id,
      organizationId: consultorioNutricao.id,
      dayOfWeek: 3,
      startTime: "10:00",
      endTime: "18:00"
    },
    {
      professionalId: doctor9.id,
      organizationId: consultorioNutricao.id,
      dayOfWeek: 5,
      startTime: "10:00",
      endTime: "18:00"
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
    },
    {
      patientId: createdPacientes[5].id,
      professionalId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Em 4 dias
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "scheduled" as const,
      notes: "Avaliação cardiológica"
    },
    {
      patientId: createdPacientes[7].id,
      professionalId: doctor5.id,
      organizationId: clinicaOrtopedica.id,
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Em 5 dias
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "confirmed" as const,
      notes: "Consulta ortopédica"
    },
    {
      patientId: createdPacientes[9].id,
      professionalId: doctor6.id,
      organizationId: consultorioPsicologia.id,
      startTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Em 6 dias
      endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "scheduled" as const,
      notes: "Sessão de psicoterapia"
    },
    {
      patientId: createdPacientes[11].id,
      professionalId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Em 7 dias
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "confirmed" as const,
      notes: "Consulta pediátrica"
    },
    {
      patientId: createdPacientes[13].id,
      professionalId: doctor8.id,
      organizationId: clinicaDermatologica.id,
      startTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // Em 8 dias
      endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "scheduled" as const,
      notes: "Consulta dermatológica"
    },
    {
      patientId: createdPacientes[0].id,
      professionalId: doctor9.id,
      organizationId: consultorioNutricao.id,
      startTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // Em 9 dias
      endTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // + 30min
      status: "confirmed" as const,
      notes: "Consulta nutricional"
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
    },
    {
      patientId: createdPacientes[5].id,
      professionalId: doctor4.id,
      organizationId: hospitalCardiaco.id,
      description: "Avaliação cardiológica - Paciente com dor no peito"
    },
    {
      patientId: createdPacientes[7].id,
      professionalId: doctor5.id,
      organizationId: clinicaOrtopedica.id,
      description: "Consulta ortopédica - Paciente com lesão no joelho"
    },
    {
      patientId: createdPacientes[9].id,
      professionalId: doctor6.id,
      organizationId: consultorioPsicologia.id,
      description: "Sessão de psicoterapia - Paciente com ansiedade"
    },
    {
      patientId: createdPacientes[11].id,
      professionalId: doctor7.id,
      organizationId: hospitalPediatrico.id,
      description: "Consulta pediátrica - Criança com febre"
    },
    {
      patientId: createdPacientes[13].id,
      professionalId: doctor8.id,
      organizationId: clinicaDermatologica.id,
      description: "Consulta dermatológica - Paciente com manchas na pele"
    },
    {
      patientId: createdPacientes[0].id,
      professionalId: doctor9.id,
      organizationId: consultorioNutricao.id,
      description: "Consulta nutricional - Paciente querendo emagrecer"
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
    },
    {
      userId: createdPacientes[5].id,
      type: "reminder",
      title: "Lembrete de Consulta",
      message: "Sua consulta cardiológica está marcada para em 4 dias às 08:00"
    },
    {
      userId: createdPacientes[7].id,
      type: "confirmation",
      title: "Consulta Confirmada",
      message: "Sua consulta ortopédica foi confirmada para em 5 dias às 14:30"
    },
    {
      userId: createdPacientes[9].id,
      type: "reminder",
      title: "Lembrete de Sessão",
      message: "Sua sessão de psicoterapia está marcada para em 6 dias às 16:00"
    },
    {
      userId: createdPacientes[11].id,
      type: "confirmation",
      title: "Consulta Confirmada",
      message: "Sua consulta pediátrica foi confirmada para em 7 dias às 09:00"
    },
    {
      userId: createdPacientes[13].id,
      type: "reminder",
      title: "Lembrete de Consulta",
      message: "Sua consulta dermatológica está marcada para em 8 dias às 11:00"
    },
    {
      userId: createdPacientes[0].id,
      type: "confirmation",
      title: "Consulta Confirmada",
      message: "Sua consulta nutricional foi confirmada para em 9 dias às 15:30"
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
  console.log(`- ${9} Organizações`);
  console.log(`- ${9} Profissionais`);
  console.log(`- ${6} Atendentes`);
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
  console.log(`- ${hospitalCardiaco.name} (CNPJ: ${hospitalCardiaco.cnpj})`);
  console.log(`- ${clinicaOrtopedica.name} (CNPJ: ${clinicaOrtopedica.cnpj})`);
  console.log(
    `- ${consultorioPsicologia.name} (CNPJ: ${consultorioPsicologia.cnpj})`
  );
  console.log(
    `- ${hospitalPediatrico.name} (CNPJ: ${hospitalPediatrico.cnpj})`
  );
  console.log(
    `- ${clinicaDermatologica.name} (CNPJ: ${clinicaDermatologica.cnpj})`
  );
  console.log(
    `- ${consultorioNutricao.name} (CNPJ: ${consultorioNutricao.cnpj})`
  );

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
  console.log(
    `- ${doctor4.email} (Dr. Roberto Cardoso) - ${hospitalCardiaco.name}`
  );
  console.log(
    `- ${doctor5.email} (Dra. Ana Ferreira) - ${clinicaOrtopedica.name}`
  );
  console.log(
    `- ${doctor6.email} (Dr. Paulo Mendes) - ${consultorioPsicologia.name}`
  );
  console.log(
    `- ${doctor7.email} (Dra. Fernanda Lima) - ${hospitalPediatrico.name}`
  );
  console.log(
    `- ${doctor8.email} (Dr. Lucas Costa) - ${clinicaDermatologica.name}`
  );
  console.log(
    `- ${doctor9.email} (Dra. Juliana Alves) - ${consultorioNutricao.name}`
  );

  console.log(`\n👥 Usuários de teste:`);
  console.log(
    `- Pacientes: ${createdPacientes.map((p) => p.email).join(", ")}`
  );
  console.log(
    `- Atendentes: ${attendant1.email}, ${attendant2.email}, ${attendant3.email}, ${attendant4.email}, ${attendant5.email}, ${attendant6.email}`
  );

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
  console.log(
    `- Agora temos 3x mais dados para testar o sistema de múltiplas organizações`
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
