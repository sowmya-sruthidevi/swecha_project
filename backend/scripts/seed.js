import 'dotenv/config';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import StudyGroup from '../models/StudyGroup.js';

const SEED_USER = {
  fullName: 'Sruthi K',
  email: 'demo@studygroup.com',
  password: 'demopass123',
  bio: 'Passionate learner | Tech enthusiast | Always curious',
};

const SEED_GROUPS = [
  {
    groupName: 'Advanced Calculus Study Circle',
    subject: 'Mathematics',
    description: 'A dedicated group for mastering advanced calculus topics including limits, derivatives, integrals, and multivariable calculus. Perfect for engineering and math majors preparing for exams or wanting to deepen their understanding.',
    date: '2026-08-25',
    time: '18:00',
    location: 'University Library, Room 301',
    meetingLink: 'https://zoom.us/j/calculus2026',
    maxMembers: 10,
  },
  {
    groupName: 'Data Structures & Algorithms Prep',
    subject: 'Computer Science',
    description: 'Weekly coding sessions focusing on data structures, algorithms, and interview preparation. We work through LeetCode problems, discuss approaches, and learn from each other. Great for placements!',
    date: '2026-08-22',
    time: '19:30',
    location: 'Online (Discord + Zoom)',
    meetingLink: 'https://discord.gg/study-cs-group',
    maxMembers: 15,
  },
  {
    groupName: 'Organic Chemistry Mastery',
    subject: 'Chemistry',
    description: 'Understanding reaction mechanisms, stereochemistry, and synthesis pathways. We use model kits, practice problems, and peer teaching to make OChem fun and less intimidating!',
    date: '2026-08-24',
    time: '16:00',
    location: 'Science Building, Lab 205',
    meetingLink: '',
    maxMembers: 8,
  },
  {
    groupName: 'IELTS Speaking Practice',
    subject: 'English',
    description: 'Daily speaking practice sessions for IELTS preparation. Mock interviews, cue card discussions, vocabulary building, and fluency exercises. All levels welcome!',
    date: '2026-08-21',
    time: '20:00',
    location: 'Online via Google Meet',
    meetingLink: 'https://meet.google.com/ielts-study-group',
    maxMembers: 6,
  },
  {
    groupName: 'Physics Problem Solving Workshop',
    subject: 'Physics',
    description: 'Solving advanced problems in classical mechanics, electromagnetism, and modern physics. Perfect for JEE, NEET, or university physics students. Bring your toughest problems!',
    date: '2026-08-26',
    time: '17:00',
    location: 'Physics Department, Seminar Hall',
    meetingLink: '',
    maxMembers: 12,
  },
  {
    groupName: 'Microeconomics Study Group',
    subject: 'Economics',
    description: 'Understanding supply & demand, market structures, game theory, and consumer behavior. We discuss case studies, work through problem sets, and help each other prepare for midterms.',
    date: '2026-08-23',
    time: '15:00',
    location: 'Business School, Room 104',
    meetingLink: 'https://zoom.us/j/econ-study',
    maxMembers: 10,
  },
  {
    groupName: 'Full-Stack Web Dev Bootcamp',
    subject: 'Computer Science',
    description: 'Building modern web applications from scratch using React, Node.js, Express, and MongoDB. Weekly mini-projects, code reviews, and portfolio building together!',
    date: '2026-08-27',
    time: '19:00',
    location: 'Hybrid (In-person + Online)',
    meetingLink: 'https://discord.gg/webdev-bootcamp',
    maxMembers: 20,
  },
];

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    await connectDB();

    console.log('🧹 Cleaning existing demo data...');
    await User.deleteOne({ email: SEED_USER.email });

    console.log('👤 Creating demo user:', SEED_USER.email);
    const user = await User.create(SEED_USER);
    console.log(`✅ Demo user created: ${user.fullName} (${user._id})`);

    console.log('📚 Creating study groups...');
    for (const g of SEED_GROUPS) {
      await StudyGroup.create({
        ...g,
        createdBy: user._id,
        creatorName: user.fullName,
        members: [user._id],
      });
    }
    console.log(`✅ ${SEED_GROUPS.length} study groups created!`);

    const groups = await StudyGroup.find({ createdBy: user._id });
    console.log('\n🎉 Seed completed successfully!');
    console.log('========================================');
    console.log('Demo credentials:');
    console.log('  Email   :', SEED_USER.email);
    console.log('  Password:', SEED_USER.password);
    console.log('  Groups  :', groups.length);
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
