// ─── Seed Script ──────────────────────────────────────────────────────────────
// Reproduces the original Week 4 in-memory demo data inside the real database.
// Run with: npx prisma db seed  (or: npm run prisma:seed)

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (children first, to respect foreign keys)
  await prisma.analysis.deleteMany();
  await prisma.review.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@stayinsight.ai',
      password: 'password123',
      role: 'admin',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@stayinsight.ai',
      password: 'demo1234',
      role: 'viewer',
    },
  });

  const review1 = await prisma.review.create({
    data: {
      guestName: 'Alice Johnson',
      property: 'Ocean View Villa',
      rating: 5,
      sentiment: 'positive',
      comment: 'Amazing stay! The view was breathtaking and the staff were incredibly attentive.',
      theme: 'cleanliness',
      tags: ['cleanliness', 'location', 'service'],
      userId: admin.id,
    },
  });

  const review2 = await prisma.review.create({
    data: {
      guestName: 'Brian Chen',
      property: 'Mountain Lodge Retreat',
      rating: 4,
      sentiment: 'positive',
      comment: 'Great location and cozy rooms. Breakfast could have had more variety.',
      theme: 'food',
      tags: ['location', 'comfort'],
      userId: demoUser.id,
    },
  });

  const review3 = await prisma.review.create({
    data: {
      guestName: 'Carla Diaz',
      property: 'Downtown Loft Suites',
      rating: 2,
      sentiment: 'negative',
      comment: 'Noisy street outside and the AC was broken for two nights.',
      theme: 'noise',
      tags: ['noise', 'maintenance'],
    },
  });

  const review4 = await prisma.review.create({
    data: {
      guestName: 'Deepak Rao',
      property: 'Ocean View Villa',
      rating: 5,
      sentiment: 'positive',
      comment: 'Second stay here, even better than the first. Highly recommend the sunset deck.',
      tags: ['location', 'value'],
      userId: admin.id,
    },
  });

  const review5 = await prisma.review.create({
    data: {
      guestName: 'Elena Petrova',
      property: 'Lakeside Cottage',
      rating: 3,
      sentiment: 'neutral',
      comment: 'Decent stay overall, nothing stood out as exceptional or bad.',
      tags: ['value'],
    },
  });

  await prisma.analysis.create({
    data: {
      reviewId: review1.id,
      summary: 'Guest highlighted cleanliness, location, and service as the strongest points.',
      keywords: ['cleanliness', 'location', 'service'],
      recommendation: 'Continue emphasizing housekeeping quality and staff training in listing photos and descriptions.',
    },
  });

  await prisma.analysis.create({
    data: {
      reviewId: review3.id,
      summary: 'Guest reported noise disturbance and a maintenance issue with the air conditioning.',
      keywords: ['noise', 'maintenance', 'AC'],
      recommendation: 'Schedule an HVAC inspection and consider soundproofing for street-facing units.',
    },
  });

  console.log('Seed complete:');
  console.log(`  Users: 2 (admin, demo)`);
  console.log(`  Reviews: 5`);
  console.log(`  Analyses: 2`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
