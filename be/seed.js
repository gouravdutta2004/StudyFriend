const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

const User = require('./src/models/User');
const Session = require('./src/models/Session');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studybuddyfinder', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await User.deleteMany();
    await Session.deleteMany();
    console.log('🗑️  Cleared existing Users and Sessions');

    // Create 3 Fake Users
    const passwordHash = await bcrypt.hash('password123', 12);
    
    const users = await User.create([
      {
        name: 'Alex Rivera',
        email: 'alex@example.com',
        password: passwordHash, // Insert pre-hashed to bypass bulk limit issues
        subjects: ['Computer Science', 'Mathematics'],
        bio: 'CS Major loving WebRTC and distributed systems.',
        level: 12,
        xp: 4500,
        league: 'GOLD',
        role: 'USER'
      },
      {
        name: 'Jordan Lee',
        email: 'jordan@example.com',
        password: passwordHash,
        subjects: ['Physics', 'Chemistry'],
        bio: 'Studying for med school. Always down for Pomodoro sessions.',
        level: 8,
        xp: 3200,
        league: 'SILVER',
        role: 'USER'
      },
      {
        name: 'Admin Supervisor',
        email: 'admin@studyfriend.co.in',
        password: passwordHash,
        subjects: ['Management'],
        bio: 'Platform super admin.',
        level: 99,
        xp: 99999,
        league: 'ELITE',
        role: 'SUPER_ADMIN'
      }
    ]);
    console.log(`👤 Created ${users.length} users (Password: password123)`);

    // Create 2 Fake Active Sessions
    const sessions = await Session.create([
      {
        title: 'Late Night Coding: React & WebRTC',
        description: 'Building a collaborative whiteboard! Hop in.',
        subject: 'Computer Science',
        host: users[0]._id,
        participants: [users[0]._id, users[1]._id],
        maxParticipants: 6,
        scheduledAt: new Date(), 
        status: 'ongoing',
        isOnline: true
      },
      {
        title: 'Physics Midterm Prep (Quantum Mechanics)',
        description: 'Reviewing chapter 4 and past papers.',
        subject: 'Physics',
        host: users[1]._id,
        participants: [users[1]._id],
        maxParticipants: 4,
        scheduledAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24), // Tomorrow
        status: 'upcoming',
        isOnline: true
      }
    ]);
    console.log(`🎥 Created ${sessions.length} study sessions`);

    console.log('✅ Seeding completed successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
