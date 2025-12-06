import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_DEPARTMENT_MAPPINGS = [
  // Engineering/Tech variations
  { originalName: 'Tech', standardizedName: 'Engineering', category: 'Technology' },
  { originalName: 'tech', standardizedName: 'Engineering', category: 'Technology' },
  { originalName: 'Dev', standardizedName: 'Engineering', category: 'Technology' },
  { originalName: 'dev', standardizedName: 'Engineering', category: 'Technology' },
  { originalName: 'Development', standardizedName: 'Engineering', category: 'Technology' },
  { originalName: 'Entwicklung', standardizedName: 'Engineering', category: 'Technology' },
  { originalName: 'IT', standardizedName: 'Engineering', category: 'Technology' },

  // Customer Success variations
  { originalName: 'CS', standardizedName: 'Customer Success', category: 'Business' },
  { originalName: 'Support', standardizedName: 'Customer Success', category: 'Business' },
  { originalName: 'Customer Support', standardizedName: 'Customer Success', category: 'Business' },

  // Sales variations
  { originalName: 'Vertrieb', standardizedName: 'Sales', category: 'Business' },
  { originalName: 'Revenue', standardizedName: 'Sales', category: 'Business' },
  { originalName: 'Business Development', standardizedName: 'Sales', category: 'Business' },

  // People/HR variations
  { originalName: 'HR', standardizedName: 'People & Culture', category: 'Operations' },
  { originalName: 'Human Resources', standardizedName: 'People & Culture', category: 'Operations' },
  { originalName: 'Talent', standardizedName: 'People & Culture', category: 'Operations' },
  { originalName: 'People', standardizedName: 'People & Culture', category: 'Operations' },

  // Finance variations
  { originalName: 'Finanzen', standardizedName: 'Finance', category: 'Operations' },
  { originalName: 'Accounting', standardizedName: 'Finance', category: 'Operations' },

  // Operations variations
  { originalName: 'Ops', standardizedName: 'Operations', category: 'Operations' },

  // Leadership variations
  { originalName: 'CEO', standardizedName: 'Leadership', category: 'Leadership' },
  { originalName: 'Executive', standardizedName: 'Leadership', category: 'Leadership' },

  // Sustainability (custom for this org)
  { originalName: 'Trees', standardizedName: 'Sustainability', category: 'Business' },
  { originalName: 'Wald', standardizedName: 'Sustainability', category: 'Business' },
  { originalName: 'Climate', standardizedName: 'Sustainability', category: 'Business' },
];

const DEFAULT_ROLE_MAPPINGS = [
  // Engineering roles
  {
    originalTitle: 'Full Stack Developer',
    standardizedTitle: 'Software Engineer',
    seniorityLevel: 'Mid',
    roleFamily: 'Engineering',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Fullstack Developer',
    standardizedTitle: 'Software Engineer',
    seniorityLevel: 'Mid',
    roleFamily: 'Engineering',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Senior Full Stack Developer',
    standardizedTitle: 'Software Engineer',
    seniorityLevel: 'Senior',
    roleFamily: 'Engineering',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Senior Fullstack Developer',
    standardizedTitle: 'Software Engineer',
    seniorityLevel: 'Senior',
    roleFamily: 'Engineering',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Tech Lead',
    standardizedTitle: 'Engineering Lead',
    seniorityLevel: 'Lead',
    roleFamily: 'Engineering',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Head of Engineering',
    standardizedTitle: 'Engineering Manager',
    seniorityLevel: 'Director',
    roleFamily: 'Engineering',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Senior Data Scientist',
    standardizedTitle: 'Data Scientist',
    seniorityLevel: 'Senior',
    roleFamily: 'Engineering',
    confidenceScore: 1.0,
  },

  // Sales roles
  {
    originalTitle: 'Sales Development Representative',
    standardizedTitle: 'Sales Development Representative',
    seniorityLevel: 'Junior',
    roleFamily: 'Sales',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Senior Sales Development Representative',
    standardizedTitle: 'Sales Development Representative',
    seniorityLevel: 'Senior',
    roleFamily: 'Sales',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Account Executive',
    standardizedTitle: 'Account Executive',
    seniorityLevel: 'Mid',
    roleFamily: 'Sales',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Sales Manager',
    standardizedTitle: 'Sales Manager',
    seniorityLevel: 'Lead',
    roleFamily: 'Sales',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Head of Sales',
    standardizedTitle: 'Sales Manager',
    seniorityLevel: 'Director',
    roleFamily: 'Sales',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Partnership Manager',
    standardizedTitle: 'Partnerships Manager',
    seniorityLevel: 'Mid',
    roleFamily: 'Sales',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'AI Revenue Architect',
    standardizedTitle: 'Revenue Operations',
    seniorityLevel: 'Mid',
    roleFamily: 'Sales',
    confidenceScore: 0.8,
  },

  // Product & Design roles
  {
    originalTitle: 'Product Designer',
    standardizedTitle: 'Product Designer',
    seniorityLevel: 'Mid',
    roleFamily: 'Product',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'UX/UI Designerin',
    standardizedTitle: 'Product Designer',
    seniorityLevel: 'Mid',
    roleFamily: 'Product',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Product Manager',
    standardizedTitle: 'Product Manager',
    seniorityLevel: 'Mid',
    roleFamily: 'Product',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Product Managerin',
    standardizedTitle: 'Product Manager',
    seniorityLevel: 'Mid',
    roleFamily: 'Product',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Chief Product Officer',
    standardizedTitle: 'Product Manager',
    seniorityLevel: 'C-Level',
    roleFamily: 'Product',
    confidenceScore: 1.0,
  },

  // Marketing roles
  {
    originalTitle: 'Brand & Marketing Designerin',
    standardizedTitle: 'Brand Designer',
    seniorityLevel: 'Mid',
    roleFamily: 'Marketing',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Chief Marketing Officer',
    standardizedTitle: 'Marketing Manager',
    seniorityLevel: 'C-Level',
    roleFamily: 'Marketing',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Marketing Lead',
    standardizedTitle: 'Marketing Manager',
    seniorityLevel: 'Lead',
    roleFamily: 'Marketing',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Head of Marketing',
    standardizedTitle: 'Marketing Manager',
    seniorityLevel: 'Director',
    roleFamily: 'Marketing',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Senior Product Marketing Managerin',
    standardizedTitle: 'Product Marketing Manager',
    seniorityLevel: 'Senior',
    roleFamily: 'Marketing',
    confidenceScore: 1.0,
  },

  // Customer Success roles
  {
    originalTitle: 'Werkstudent Customer Success & Sustainability',
    standardizedTitle: 'Customer Success Associate',
    seniorityLevel: 'Junior',
    roleFamily: 'Customer Success',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Junior Customer Success Managerin & Sustainability Experte',
    standardizedTitle: 'Customer Success Manager',
    seniorityLevel: 'Junior',
    roleFamily: 'Customer Success',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Head of Customer Success',
    standardizedTitle: 'Customer Success Manager',
    seniorityLevel: 'Director',
    roleFamily: 'Customer Success',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Praktikum im Customer Success Management (m/w/d)',
    standardizedTitle: 'Customer Success Associate',
    seniorityLevel: 'Junior',
    roleFamily: 'Customer Success',
    confidenceScore: 1.0,
  },

  // Operations roles
  {
    originalTitle: 'Chief Operations Officer',
    standardizedTitle: 'Operations Manager',
    seniorityLevel: 'C-Level',
    roleFamily: 'Operations',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Operations & Organizational Development Manager Sustainability',
    standardizedTitle: 'Operations Manager',
    seniorityLevel: 'Mid',
    roleFamily: 'Operations',
    confidenceScore: 1.0,
  },

  // Finance roles
  {
    originalTitle: 'Chief Financial Officer',
    standardizedTitle: 'Finance Manager',
    seniorityLevel: 'C-Level',
    roleFamily: 'Finance',
    confidenceScore: 1.0,
  },

  // People roles
  {
    originalTitle: 'People & Talent Acquisition Lead',
    standardizedTitle: 'Talent Acquisition Manager',
    seniorityLevel: 'Lead',
    roleFamily: 'People & Culture',
    confidenceScore: 1.0,
  },

  // Sustainability roles (custom)
  {
    originalTitle: 'Senior Sustainability Managerin',
    standardizedTitle: 'Sustainability Manager',
    seniorityLevel: 'Senior',
    roleFamily: 'Sustainability',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Mid Level Sustainability Managerin',
    standardizedTitle: 'Sustainability Manager',
    seniorityLevel: 'Mid',
    roleFamily: 'Sustainability',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Sustainability Manager',
    standardizedTitle: 'Sustainability Manager',
    seniorityLevel: 'Mid',
    roleFamily: 'Sustainability',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Chief Sustainability Officer / Klimaförster',
    standardizedTitle: 'Sustainability Manager',
    seniorityLevel: 'C-Level',
    roleFamily: 'Sustainability',
    confidenceScore: 1.0,
  },
  {
    originalTitle: '(Pflicht-) Praktikum Sustainability (m/w/d)',
    standardizedTitle: 'Sustainability Associate',
    seniorityLevel: 'Junior',
    roleFamily: 'Sustainability',
    confidenceScore: 1.0,
  },
  {
    originalTitle: 'Wald & Product Marketing Specialist',
    standardizedTitle: 'Product Marketing Manager',
    seniorityLevel: 'Mid',
    roleFamily: 'Marketing',
    confidenceScore: 0.9,
  },

  // Legal roles
  {
    originalTitle: 'Legal Counsel',
    standardizedTitle: 'Legal Counsel',
    seniorityLevel: 'Mid',
    roleFamily: 'Legal',
    confidenceScore: 1.0,
  },

  // Leadership
  {
    originalTitle: 'Geschäftsführer',
    standardizedTitle: 'Chief Executive Officer',
    seniorityLevel: 'C-Level',
    roleFamily: 'Leadership',
    confidenceScore: 1.0,
  },
];

async function seedMappings() {
  console.log('🌱 Seeding department and role mappings...');

  // Clear existing global mappings (userId = null)
  await prisma.departmentMapping.deleteMany({
    where: { userId: null },
  });
  await prisma.roleMapping.deleteMany({
    where: { userId: null },
  });

  // Seed department mappings
  for (const mapping of DEFAULT_DEPARTMENT_MAPPINGS) {
    await prisma.departmentMapping.create({
      data: {
        ...mapping,
        userId: null, // Global mapping
      },
    });
  }
  console.log(`✅ Created ${DEFAULT_DEPARTMENT_MAPPINGS.length} department mappings`);

  // Seed role mappings
  for (const mapping of DEFAULT_ROLE_MAPPINGS) {
    await prisma.roleMapping.create({
      data: {
        ...mapping,
        userId: null, // Global mapping
      },
    });
  }
  console.log(`✅ Created ${DEFAULT_ROLE_MAPPINGS.length} role mappings`);

  console.log('✨ Seeding complete!');
}

seedMappings()
  .catch((e) => {
    console.error('Error seeding mappings:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
