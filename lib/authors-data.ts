export type AuthorProfile = {
  author_id: number
  name: string
  handle: string
  role: string
  avatar: string
  banner: string
  bio: string
  social: {
    github?: string
    twitter?: string
    linkedin?: string
    website?: string
  }
  initialFollowers: number
}

export const AUTHORS_DATA: Record<number, AuthorProfile> = {
  1: {
    author_id: 1,
    name: 'ดร. ธนวัฒน์ หาญณรงค์',
    handle: '@thanawat_dev',
    role: 'Senior Full-Stack Architect & Next.js Core Contributor',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
    bio: 'ผู้เชี่ยวชาญด้าน Modern Web Development และ Enterprise Software Architecture ประสบการณ์มากกว่า 12 ปีในการออกแบบระบบสเกลใหญ่ มุ่งมั่นเผยแพร่ความรู้ด้าน Next.js 15 และ Clean Architecture แก่นักพัฒนาไทย',
    social: {
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      website: 'https://thanawat.dev'
    },
    initialFollowers: 1420
  },
  2: {
    author_id: 2,
    name: 'อ. ธีรดา หล่อทอง',
    handle: '@thirada_cloud',
    role: 'Cloud Solutions Architect & Database Specialist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
    bio: 'วิศวกรผู้หลงใหลในเทคโนโลยีคลาวด์และฐานข้อมูลเชิงสัมพันธ์ ผู้เชี่ยวชาญ Supabase, PostgreSQL RLS และ Docker Containerization มุ่งเน้นการสอนให้นักพัฒนาเข้าใจโครงสร้างระบบอย่างลึกซึ้ง',
    social: {
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com'
    },
    initialFollowers: 980
  },
  3: {
    author_id: 3,
    name: 'Alex River',
    handle: '@alexriver_code',
    role: 'Lead Frontend Engineer & TypeScript Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
    bio: 'Frontend specialist passionate about Type-Safe architecture, React 19 concurrent features, and scalable UI systems. Author of best-selling TypeScript guides.',
    social: {
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      linkedin: 'https://linkedin.com',
      website: 'https://alexriver.io'
    },
    initialFollowers: 2150
  },
  4: {
    author_id: 4,
    name: 'Sarah Connor',
    handle: '@sarah_designs',
    role: 'Principal Product Designer & Design Systems Lead',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    bio: 'ผู้ออกแบบประสบการณ์ดิจิทัลที่เชื่อมโยงความสวยงามและการเขียนโค้ดเข้าด้วยกัน เชี่ยวชาญการสร้าง Figma Design Systems และการแปลงเป็น Tailwind CSS แบบมีประสิทธิภาพสูงสุด',
    social: {
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      website: 'https://sarahdesigns.co'
    },
    initialFollowers: 1780
  },
  5: {
    author_id: 5,
    name: 'John Doe',
    handle: '@johndoe_sec',
    role: 'Senior Backend Engineer & Cybersecurity Researcher',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    bio: 'ผู้เชี่ยวชาญด้าน Microservices, High-Performance SQL Optimization และความปลอดภัยของ Web APIs ที่ผ่านการทดสอบกับระบบธุรกรรมการเงินระดับสูง',
    social: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com'
    },
    initialFollowers: 1120
  }
}
