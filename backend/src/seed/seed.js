require('dotenv').config();
const connectDB = require('../configuration/db');
const Centre = require('../models/Centre');
const Slot = require('../models/Slot');

async function seed() {
  await connectDB();
  await Centre.deleteMany({});
  await Slot.deleteMany({});

  const centres = await Centre.insertMany([
    {
      name: 'Mandi Centre - Hubballi',
      location: { lat: 15.3647, lng: 75.124, district: 'Dharwad' },
      cropsAccepted: ['wheat', 'cotton'],
      capacityPerSlot: 25,
      currentQueueLength: 12
    },
    {
      name: 'Mandi Centre - Belagavi',
      location: { lat: 15.8497, lng: 74.4977, district: 'Belagavi' },
      cropsAccepted: ['wheat', 'sugarcane'],
      capacityPerSlot: 30,
      currentQueueLength: 40
    },
    {
      name: 'Mandi Centre - Mysuru',
      location: { lat: 12.2958, lng: 76.6394, district: 'Mysuru' },
      cropsAccepted: ['cotton', 'ragi'],
      capacityPerSlot: 20,
      currentQueueLength: 5
    }
  ]);

  // Create slots for the next 14 days so a farmer picking any near-future
  // date in the Smart Slot form actually finds something available —
  // a single "today only" slot goes stale the moment the day changes.
  const SLOT_TIMES = [
    { startTime: '09:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '13:00' },
    { startTime: '14:00', endTime: '16:00' }
  ];
  const DAYS_AHEAD = 14;

  const slotsToInsert = [];
  for (const centre of centres) {
    for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
      const now = new Date();
      // Build the date at UTC midnight — this matches how the frontend's
      // <input type="date"> string (e.g. "2026-08-29") gets parsed by
      // `new Date(dateString)`, which JS always treats as UTC midnight.
      // Seeding with local midnight would silently mismatch on any
      // machine not running in UTC, and slots would never be found.
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset));
      for (const { startTime, endTime } of SLOT_TIMES) {
        slotsToInsert.push({
          centre: centre._id,
          date,
          startTime,
          endTime,
          capacity: centre.capacityPerSlot,
          booked: 0
        });
      }
    }
  }
  await Slot.insertMany(slotsToInsert);

  console.log('Seed data inserted:', centres.map((c) => c.name).join(', '));
  console.log(`Created ${slotsToInsert.length} slots across the next ${DAYS_AHEAD} days.`);
  process.exit(0);
}

seed();
