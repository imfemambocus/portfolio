export const IDENTITY = {
  // the preferred written form everywhere public; fullName is for formal documents only
  name: 'Isfaaq M. F. Emambocus',
  fullName: 'Isfaaq Mohamed Fahiim Emambocus',
  role: 'R&D Specialist',
  org: 'Luxembourg Centre for Systems Biomedicine, University of Luxembourg',
  tagline: 'Full-stack developer. React, React Native, Vue and Laravel.',
  email: 'imfemambocus@gmail.com',
  github: 'https://github.com/imfemambocus',
  linkedin: 'https://www.linkedin.com/in/isfaaqemambocus-softwareengineer/',
  x: 'https://x.com/IMFEmambocus',
} as const

export const HERO_META = [
  { id: 'experience', label: 'Experience', value: '7+ years' },
  { id: 'based', label: 'Based', value: 'Luxembourg' },
  { id: 'stack', label: 'Stack', value: 'React, Vue, Laravel' },
] as const

export const PROFILE = [
  'Seven years building production web applications, from a Mauritian web agency shipping sixty sites a month to enterprise frontends for Volkswagen, Pampers and Novartis.',
  'Now at the LCSB, building data-heavy interfaces for biomedical research. Frontend-leaning, but I own products end to end.',
] as const

export type Role = {
  readonly id: string
  readonly title: string
  readonly org: string
  // short form for the progress rail: a full institution name overruns it
  readonly short: string
  readonly place: string
  readonly period: string
  readonly note?: string
  readonly points: readonly string[]
}

export const ROLES: readonly Role[] = [
  {
    id: 'lcsb',
    title: 'R&D Specialist',
    org: 'Luxembourg Centre for Systems Biomedicine',
    short: 'LCSB',
    place: 'University of Luxembourg',
    period: 'Apr 2026 to present',
    points: [
      'Build and own research-facing web applications for biomedical data, working across the full stack of the products I am responsible for',
      'Data-heavy Vue 3 and TypeScript interfaces: large interactive tables, charting, and query layers built for responsiveness at scale',
      'Extending into JVM backend work alongside the frontend',
    ],
  },
  {
    id: 'gac',
    title: 'Developer',
    org: 'GAC Software',
    short: 'GAC Software',
    place: 'Mauritius',
    period: 'Oct 2025 to Mar 2026',
    points: [
      'Built vehicle telematics features across two platforms, integrating provider APIs from Renault, Volkswagen, Echoes and Mobilisights',
      'Delivered activation, deactivation and pack change workflows with transactional consistency and full status lifecycle management',
      'Architected an asynchronous eligibility system using two-step inquiry and polling with database caching and batch processing',
    ],
  },
  {
    id: 'elca',
    title: 'Senior Frontend Engineer',
    org: 'ELCA',
    short: 'ELCA',
    place: 'Mauritius',
    period: 'Jan 2024 to Aug 2024',
    points: [
      'Worked on the redesign of an award-winning Swiss e-commerce platform in React 18 with Redux and Redux Saga',
      'Migrated a legacy React 16 codebase to React 18, cutting build time by 31%',
      'Ran weekly production releases and reviewed code for modern React practice',
    ],
  },
  {
    id: 'rapp',
    title: 'Senior Frontend Engineer',
    org: 'RAPP Indian Ocean',
    short: 'RAPP',
    place: 'Mauritius',
    period: 'Feb 2022 to Jan 2024',
    points: [
      'Led three frontend developers delivering a Next.js application on Contentful and GraphQL, launched ahead of schedule',
      'Raised accessibility compliance on the Pampers web application, lifting its PageSpeed Insights score by 18%',
      'Profiled and optimised the Volkswagen UK React application, and reviewed code across Pampers and Novartis',
    ],
  },
  {
    id: 'imfe',
    title: 'Software Engineer, freelance',
    org: 'IMFE Studio',
    short: 'IMFE Studio',
    place: 'Mauritius',
    period: 'Feb 2019 to Feb 2022',
    note: 'Alongside the Linkeo role',
    points: [
      'Built full-stack applications in Symfony and Laravel with React on the frontend via Inertia.js, improving client operational efficiency by 20%',
      'Cut content management overhead by 30% with EasyAdmin solutions',
      'Shipped cross-platform mobile apps in Flutter, reaching market 40% faster than native equivalents',
    ],
  },
  {
    id: 'linkeo',
    title: 'Team Leader, Webmaster',
    org: 'Linkeo',
    short: 'Linkeo',
    place: 'Mauritius',
    period: 'Feb 2019 to Feb 2022',
    points: [
      'Managed a team of 10 to 12 webmasters, taking monthly output from 110 to 175 websites',
      'Doubled the monthly integration target personally, delivering 60+ sites against a target of 30',
      'Trained junior developers through Linkeo Academy with an 80% promotion rate',
    ],
  },
] as const

export const SKILL_CLUSTERS = [
  {
    id: 'frontend',
    label: 'Frontend',
    items: [
      'React',
      'React Native',
      'Vue 3',
      'TypeScript',
      'Tailwind',
      'GSAP',
      'react-three-fiber',
      'Redux Saga',
      'Pinia',
      'TanStack Query',
      'GraphQL',
      'WCAG',
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    items: ['Laravel', 'Symfony', 'Java, Spring', 'FastAPI', 'Node.js', 'PostgreSQL', 'Inertia.js'],
  },
  {
    id: 'data',
    label: 'Data',
    items: ['scikit-learn', 'Pandas', 'NumPy', 'R, Quarto', 'ECharts', 'AG Grid'],
  },
  {
    id: 'craft',
    label: 'Craft',
    items: ['Vite', 'Docker', 'CI/CD', 'SonarQube', 'Atomic Design', 'Accessibility'],
  },
] as const

export type Project = {
  readonly id: string
  readonly name: string
  readonly kind: string
  // the year the project itself was last worked on, not the year the repo last saw a commit
  readonly updated: string
  readonly stack: readonly string[]
  readonly body: string
  readonly repo: string
  readonly bannerDark: string
  readonly bannerLight: string
}

export const PROJECTS: readonly Project[] = [
  {
    id: 'sley-ui',
    name: 'Sley UI',
    kind: 'Component registry',
    updated: '2026',
    stack: ['React', 'TypeScript', 'Ark UI', 'Tailwind v4'],
    body: 'React components for the interfaces that hold a lot of data: tables, filter bars, command palettes, long forms. A command copies the source into your project instead of adding a dependency, and one attribute on the root element moves every component between comfortable, compact and dense.',
    repo: 'https://github.com/imfemambocus/sley-ui',
    bannerDark: '/projects/sley-ui-dark.webp',
    bannerLight: '/projects/sley-ui-light.webp',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    kind: 'Personal site',
    updated: '2026',
    stack: ['react-three-fiber', 'GLSL', 'GSAP', 'Lenis'],
    body: 'The site you are reading. One field of 160,000 particles takes a different form for every section, so a single element evolves the whole way down instead of each section animating on its own. Every form is a tile in one float texture and the morph runs in a vertex shader, so scrolling costs no CPU work.',
    repo: 'https://github.com/imfemambocus/portfolio',
    bannerDark: '/projects/portfolio-dark.webp',
    bannerLight: '/projects/portfolio-light.webp',
  },
  {
    id: 'chemspace',
    name: 'ChemSpace',
    kind: 'Molecule viewer',
    updated: '2026',
    stack: ['React', 'react-three-fiber', 'TypeScript', 'PubChem API'],
    body: 'A compound page that renders real 3D molecular structures pulled live from PubChem, with a property radar and druglikeness scoring computed client-side. Built to stay tiny on first paint: one WebGL context, everything else plain SVG.',
    repo: 'https://github.com/imfemambocus/chemspace',
    bannerDark: '/projects/chemspace-dark.webp',
    bannerLight: '/projects/chemspace-light.webp',
  },
  {
    id: 'sift',
    name: 'Sift',
    kind: 'Notification hub',
    updated: '2026',
    stack: ['Java', 'Spring Boot', 'React', 'PostgreSQL'],
    body: 'A notification hub that gathers GitLab activity and Gmail into one feed, and keeps only what actually concerns you. The fuzzy search lives inside the feed query, so Postgres does the matching, the filtering and the paging in a single statement.',
    repo: 'https://github.com/imfemambocus/sift',
    bannerDark: '/projects/sift-dark.webp',
    bannerLight: '/projects/sift-light.webp',
  },
  {
    id: 'farmlink',
    name: 'Farmlink',
    kind: 'MSc dissertation',
    updated: '2025',
    stack: ['React Native', 'FastAPI', 'scikit-learn', 'PostgreSQL'],
    body: 'An agricultural marketplace connecting Mauritian farmers directly with buyers, built around a hybrid recommender that pairs rule-based logic with collaborative filtering. Voice commands and English/French support were there so the app worked for the farmers, not just the buyers.',
    repo: 'https://github.com/imfemambocus/farmlink',
    bannerDark: '/projects/farmlink-dark.webp',
    bannerLight: '/projects/farmlink-light.webp',
  },
] as const

export const EDUCATION = [
  {
    id: 'msc',
    qualification: 'MSc Software Engineering',
    school: 'Kingston University London',
    period: 'Sep 2024 to Sep 2025',
    detail: 'Software architectures, agile development, data programming, software quality engineering.',
  },
  {
    id: 'bcs',
    qualification: 'Professional Graduate Diploma in IT',
    school: 'BCS, The Chartered Institute for IT',
    period: '2019 to 2023',
    detail: 'RQF Level 6.',
  },
] as const
