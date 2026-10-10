// Prisma seed script - creates one demo household with realistic sample data:
// a user, several tasks, a day's schedule, one paired-looking TV device, and a short
// AI conversation history. Safe to re-run: it clears this demo user's own rows first
// rather than duplicating them on every `npm run prisma:seed`.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function todayISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function at(hhmm, dayOffset = 0) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding HomeSphere demo data...');

  const user = await prisma.user.upsert({
    where: { id: 'seed-demo-user' },
    update: { name: 'Alex', preferences: { demoMode: true } },
    create: { id: 'seed-demo-user', name: 'Alex', preferences: { demoMode: true } },
  });

  // Re-seeding should refresh the demo data, not pile up duplicates.
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.schedule.deleteMany({ where: { userId: user.id } });
  await prisma.aiConversation.deleteMany({ where: { userId: user.id } });
  await prisma.device.deleteMany({ where: { userId: user.id } });

  await prisma.task.createMany({
    data: [
      { title: 'Finish assignment', description: 'Wrap up and submit the weekly assignment', priority: 'HIGH', status: 'pending', dueDate: at('18:00'), createdBy: 'demo', userId: user.id },
      { title: 'Revise for tomorrow\u2019s exam', description: 'Chapters 4 to 6 and practice questions', priority: 'HIGH', status: 'pending', dueDate: at('20:00'), createdBy: 'demo', userId: user.id },
      { title: 'Buy groceries (outdoor errand)', description: 'Vegetables, milk, bread', priority: 'MEDIUM', status: 'pending', dueDate: at('17:00'), createdBy: 'demo', userId: user.id },
      { title: 'Water the balcony plants', description: '', priority: 'LOW', status: 'pending', dueDate: at('17:30'), createdBy: 'demo', userId: user.id },
      { title: 'Fold the laundry', description: '', priority: 'LOW', status: 'done', dueDate: at('12:00'), createdBy: 'demo', userId: user.id },
      { title: 'Call the electrician', description: 'Ask about the hallway light', priority: 'MEDIUM', status: 'pending', dueDate: at('10:00', 1), createdBy: 'demo', userId: user.id },
    ],
  });

  const today = todayISO();
  await prisma.schedule.createMany({
    data: [
      { title: 'Morning stand-up', startTime: '09:30', endTime: '10:00', date: today, source: 'demo', userId: user.id },
      { title: 'Lunch', startTime: '13:00', endTime: '13:45', date: today, source: 'demo', userId: user.id },
      { title: 'Assignment', startTime: '17:00', endTime: '18:30', date: today, source: 'demo', userId: user.id },
      { title: 'Break', startTime: '18:30', endTime: '19:00', date: today, source: 'demo', userId: user.id },
      { title: 'Exam revision', startTime: '19:00', endTime: '20:30', date: today, source: 'demo', userId: user.id },
      { title: 'Dinner', startTime: '20:30', endTime: '21:15', date: today, source: 'demo', userId: user.id },
    ],
  });

  await prisma.device.create({
    data: {
      deviceId: 'tv_demo_living_room',
      name: 'Living Room TV',
      pairingCode: null,
      pairingExpiresAt: null,
      connectedAt: new Date(),
      userId: user.id,
    },
  });

  const minutesAgo = (n) => new Date(Date.now() - n * 60_000);
  await prisma.aiConversation.createMany({
    data: [
      { role: 'user', message: 'Plan my evening.', source: 'tv', timestamp: minutesAgo(40), userId: user.id },
      { role: 'assistant', message: 'Your evening plan: Assignment at 5:00 PM, then a break, then exam revision at 7:00 PM, dinner at 8:30 PM.', source: 'system', timestamp: minutesAgo(39), userId: user.id },
      { role: 'user', message: 'What should I do before the rain?', source: 'phone', timestamp: minutesAgo(15), userId: user.id },
      { role: 'assistant', message: 'Rain chance is 70% this evening. Consider buying groceries and watering the plants before it starts.', source: 'system', timestamp: minutesAgo(14), userId: user.id },
    ],
  });

  console.log('Seed complete:');
  console.log(`  User:          ${user.name} (${user.id})`);
  console.log('  Tasks:         6');
  console.log(`  Schedule:      6 entries for ${today}`);
  console.log('  Device:        Living Room TV (tv_demo_living_room)');
  console.log('  AI messages:   4');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
