import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLE_TAXONOMY_SEEDS = [
  // Engineering Family
  {
    roleFamily: 'Engineering',
    roleTitle: 'Software Engineer',
    seniorityLevel: 'Junior',
    aliases: ['Junior Developer', 'Junior Software Developer', 'Associate Engineer'],
    description: 'Entry-level software engineering role',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Software Engineer',
    seniorityLevel: 'Mid',
    aliases: ['Developer', 'Software Developer', 'Fullstack Developer', 'Full Stack Developer'],
    description: 'Mid-level software engineering role',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Software Engineer',
    seniorityLevel: 'Senior',
    aliases: ['Senior Developer', 'Senior Software Developer', 'Senior Fullstack Engineer'],
    description: 'Senior-level software engineering role',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Software Engineer',
    seniorityLevel: 'Staff',
    aliases: ['Staff Engineer', 'Staff Software Engineer', 'Principal Engineer'],
    description: 'Staff/Principal-level engineering role',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Engineering Manager',
    seniorityLevel: 'Manager',
    aliases: ['Engineering Lead', 'Tech Lead', 'Team Lead'],
    description: 'Engineering people manager',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Engineering Manager',
    seniorityLevel: 'Director',
    aliases: ['Director of Engineering', 'Head of Engineering', 'Engineering Director'],
    description: 'Director-level engineering leadership',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Engineering Manager',
    seniorityLevel: 'VP',
    aliases: ['VP of Engineering', 'VP Engineering', 'Vice President of Engineering'],
    description: 'VP-level engineering leadership',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Engineering Manager',
    seniorityLevel: 'C-Level',
    aliases: ['CTO', 'Chief Technology Officer', 'Chief Technical Officer'],
    description: 'C-level engineering leadership',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Data Scientist',
    seniorityLevel: 'Mid',
    aliases: ['Data Analyst', 'ML Engineer', 'Machine Learning Engineer'],
    description: 'Data science and machine learning role',
  },
  {
    roleFamily: 'Engineering',
    roleTitle: 'Data Scientist',
    seniorityLevel: 'Senior',
    aliases: ['Senior Data Scientist', 'Senior ML Engineer', 'Senior Machine Learning Engineer'],
    description: 'Senior data science role',
  },

  // Sales Family
  {
    roleFamily: 'Sales',
    roleTitle: 'Sales Development Representative',
    seniorityLevel: 'Junior',
    aliases: ['SDR', 'BDR', 'Business Development Representative', 'Inside Sales Rep'],
    description: 'Entry-level outbound sales role',
  },
  {
    roleFamily: 'Sales',
    roleTitle: 'Account Executive',
    seniorityLevel: 'Mid',
    aliases: ['AE', 'Sales Executive', 'Account Manager'],
    description: 'Mid-level closing sales role',
  },
  {
    roleFamily: 'Sales',
    roleTitle: 'Account Executive',
    seniorityLevel: 'Senior',
    aliases: ['Senior AE', 'Senior Account Executive', 'Enterprise AE'],
    description: 'Senior closing sales role',
  },
  {
    roleFamily: 'Sales',
    roleTitle: 'Sales Manager',
    seniorityLevel: 'Manager',
    aliases: ['Sales Team Lead', 'Sales Lead', 'Regional Sales Manager'],
    description: 'Sales team manager',
  },
  {
    roleFamily: 'Sales',
    roleTitle: 'Sales Manager',
    seniorityLevel: 'Director',
    aliases: ['Director of Sales', 'Head of Sales', 'Sales Director'],
    description: 'Director-level sales leadership',
  },
  {
    roleFamily: 'Sales',
    roleTitle: 'Sales Manager',
    seniorityLevel: 'VP',
    aliases: ['VP of Sales', 'VP Sales', 'Vice President of Sales'],
    description: 'VP-level sales leadership',
  },
  {
    roleFamily: 'Sales',
    roleTitle: 'Sales Manager',
    seniorityLevel: 'C-Level',
    aliases: ['CRO', 'Chief Revenue Officer', 'Chief Sales Officer'],
    description: 'C-level sales/revenue leadership',
  },
  {
    roleFamily: 'Sales',
    roleTitle: 'Partnerships Manager',
    seniorityLevel: 'Mid',
    aliases: ['Partnership Manager', 'Business Development Manager', 'Channel Manager'],
    description: 'Strategic partnerships role',
  },

  // Product Family
  {
    roleFamily: 'Product',
    roleTitle: 'Product Manager',
    seniorityLevel: 'Mid',
    aliases: ['PM', 'Product Owner', 'Associate Product Manager'],
    description: 'Product management role',
  },
  {
    roleFamily: 'Product',
    roleTitle: 'Product Manager',
    seniorityLevel: 'Senior',
    aliases: ['Senior PM', 'Senior Product Manager', 'Lead Product Manager'],
    description: 'Senior product management role',
  },
  {
    roleFamily: 'Product',
    roleTitle: 'Product Manager',
    seniorityLevel: 'Director',
    aliases: ['Director of Product', 'Head of Product', 'Product Director'],
    description: 'Director-level product leadership',
  },
  {
    roleFamily: 'Product',
    roleTitle: 'Product Manager',
    seniorityLevel: 'VP',
    aliases: ['VP of Product', 'VP Product'],
    description: 'VP-level product leadership',
  },
  {
    roleFamily: 'Product',
    roleTitle: 'Product Manager',
    seniorityLevel: 'C-Level',
    aliases: ['CPO', 'Chief Product Officer'],
    description: 'C-level product leadership',
  },
  {
    roleFamily: 'Product',
    roleTitle: 'Product Designer',
    seniorityLevel: 'Mid',
    aliases: ['UX Designer', 'UI Designer', 'UX/UI Designer', 'Designer'],
    description: 'Product design role',
  },
  {
    roleFamily: 'Product',
    roleTitle: 'Product Designer',
    seniorityLevel: 'Senior',
    aliases: ['Senior Designer', 'Senior UX Designer', 'Senior Product Designer'],
    description: 'Senior product design role',
  },

  // Marketing Family
  {
    roleFamily: 'Marketing',
    roleTitle: 'Marketing Manager',
    seniorityLevel: 'Mid',
    aliases: ['Marketing Specialist', 'Digital Marketing Manager', 'Growth Marketer'],
    description: 'Marketing management role',
  },
  {
    roleFamily: 'Marketing',
    roleTitle: 'Marketing Manager',
    seniorityLevel: 'Senior',
    aliases: ['Senior Marketing Manager', 'Marketing Lead'],
    description: 'Senior marketing role',
  },
  {
    roleFamily: 'Marketing',
    roleTitle: 'Marketing Manager',
    seniorityLevel: 'Director',
    aliases: ['Director of Marketing', 'Head of Marketing', 'Marketing Director'],
    description: 'Director-level marketing leadership',
  },
  {
    roleFamily: 'Marketing',
    roleTitle: 'Marketing Manager',
    seniorityLevel: 'VP',
    aliases: ['VP of Marketing', 'VP Marketing'],
    description: 'VP-level marketing leadership',
  },
  {
    roleFamily: 'Marketing',
    roleTitle: 'Marketing Manager',
    seniorityLevel: 'C-Level',
    aliases: ['CMO', 'Chief Marketing Officer'],
    description: 'C-level marketing leadership',
  },
  {
    roleFamily: 'Marketing',
    roleTitle: 'Product Marketing Manager',
    seniorityLevel: 'Mid',
    aliases: ['PMM', 'Product Marketer'],
    description: 'Product marketing role',
  },
  {
    roleFamily: 'Marketing',
    roleTitle: 'Brand Designer',
    seniorityLevel: 'Mid',
    aliases: ['Brand & Marketing Designer', 'Graphic Designer', 'Creative Designer'],
    description: 'Brand and creative design role',
  },

  // Customer Success Family
  {
    roleFamily: 'Customer Success',
    roleTitle: 'Customer Success Manager',
    seniorityLevel: 'Junior',
    aliases: ['Junior CSM', 'Customer Success Associate', 'CS Associate'],
    description: 'Entry-level customer success role',
  },
  {
    roleFamily: 'Customer Success',
    roleTitle: 'Customer Success Manager',
    seniorityLevel: 'Mid',
    aliases: ['CSM', 'Account Manager', 'Customer Success Specialist'],
    description: 'Customer success management role',
  },
  {
    roleFamily: 'Customer Success',
    roleTitle: 'Customer Success Manager',
    seniorityLevel: 'Senior',
    aliases: ['Senior CSM', 'Senior Customer Success Manager', 'Enterprise CSM'],
    description: 'Senior customer success role',
  },
  {
    roleFamily: 'Customer Success',
    roleTitle: 'Customer Success Manager',
    seniorityLevel: 'Director',
    aliases: ['Director of Customer Success', 'Head of Customer Success', 'CS Director'],
    description: 'Director-level CS leadership',
  },

  // Operations Family
  {
    roleFamily: 'Operations',
    roleTitle: 'Operations Manager',
    seniorityLevel: 'Mid',
    aliases: ['Operations Specialist', 'Ops Manager', 'Business Operations Manager'],
    description: 'Operations management role',
  },
  {
    roleFamily: 'Operations',
    roleTitle: 'Operations Manager',
    seniorityLevel: 'Director',
    aliases: ['Director of Operations', 'Head of Operations', 'Operations Director'],
    description: 'Director-level operations leadership',
  },
  {
    roleFamily: 'Operations',
    roleTitle: 'Operations Manager',
    seniorityLevel: 'C-Level',
    aliases: ['COO', 'Chief Operating Officer'],
    description: 'C-level operations leadership',
  },

  // Finance Family
  {
    roleFamily: 'Finance',
    roleTitle: 'Finance Manager',
    seniorityLevel: 'Mid',
    aliases: ['Financial Analyst', 'Accountant', 'Controller'],
    description: 'Finance management role',
  },
  {
    roleFamily: 'Finance',
    roleTitle: 'Finance Manager',
    seniorityLevel: 'C-Level',
    aliases: ['CFO', 'Chief Financial Officer'],
    description: 'C-level finance leadership',
  },

  // People & Culture Family
  {
    roleFamily: 'People & Culture',
    roleTitle: 'Talent Acquisition Manager',
    seniorityLevel: 'Mid',
    aliases: ['Recruiter', 'People & Talent Acquisition Lead', 'Talent Partner'],
    description: 'Talent acquisition role',
  },
  {
    roleFamily: 'People & Culture',
    roleTitle: 'People Operations Manager',
    seniorityLevel: 'Mid',
    aliases: ['HR Manager', 'People Manager', 'People Ops'],
    description: 'People operations role',
  },
  {
    roleFamily: 'People & Culture',
    roleTitle: 'People Operations Manager',
    seniorityLevel: 'Director',
    aliases: ['Head of People', 'Director of People', 'CHRO'],
    description: 'Director-level people leadership',
  },

  // Sustainability Family (custom for this org)
  {
    roleFamily: 'Sustainability',
    roleTitle: 'Sustainability Manager',
    seniorityLevel: 'Junior',
    aliases: ['Sustainability Associate', 'Junior Sustainability Manager', 'Sustainability Analyst'],
    description: 'Entry-level sustainability role',
  },
  {
    roleFamily: 'Sustainability',
    roleTitle: 'Sustainability Manager',
    seniorityLevel: 'Mid',
    aliases: ['Mid Level Sustainability Manager', 'Sustainability Specialist'],
    description: 'Mid-level sustainability role',
  },
  {
    roleFamily: 'Sustainability',
    roleTitle: 'Sustainability Manager',
    seniorityLevel: 'Senior',
    aliases: ['Senior Sustainability Manager', 'Lead Sustainability Manager'],
    description: 'Senior sustainability role',
  },
  {
    roleFamily: 'Sustainability',
    roleTitle: 'Sustainability Manager',
    seniorityLevel: 'C-Level',
    aliases: ['Chief Sustainability Officer', 'CSO', 'Klimaförster'],
    description: 'C-level sustainability leadership',
  },

  // Legal Family
  {
    roleFamily: 'Legal',
    roleTitle: 'Legal Counsel',
    seniorityLevel: 'Mid',
    aliases: ['Lawyer', 'Attorney', 'In-House Counsel'],
    description: 'Legal counsel role',
  },

  // Leadership/Executive
  {
    roleFamily: 'Leadership',
    roleTitle: 'Chief Executive Officer',
    seniorityLevel: 'C-Level',
    aliases: ['CEO', 'Geschäftsführer', 'Managing Director', 'President'],
    description: 'Chief Executive Officer',
  },
];

async function seedRoleTaxonomy() {
  console.log('🌱 Seeding role taxonomy...');

  // Clear existing taxonomy
  await prisma.roleTaxonomy.deleteMany({});

  // Seed taxonomy
  for (const role of ROLE_TAXONOMY_SEEDS) {
    await prisma.roleTaxonomy.create({
      data: role,
    });
  }

  console.log(`✅ Created ${ROLE_TAXONOMY_SEEDS.length} role taxonomy entries`);
  console.log('✨ Role taxonomy seeding complete!');
}

seedRoleTaxonomy()
  .catch((e) => {
    console.error('Error seeding role taxonomy:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
