const SeniorProfile = require('../models/SeniorProfile');
const Caretaker = require('../models/Caretaker');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const FamilyCheckIn = require('../models/FamilyCheckIn');
const User = require('../models/User');
const Device = require('../models/Device');
const Consent = require('../models/Consent');
const FamilyRelationship = require('../models/FamilyRelationship');
const Organization = require('../models/Organization');

async function seedInitialData() {
  try {
    // 1. Seed Senior
    const existingSenior = await SeniorProfile.findOne({ seniorId: 'S102' });
    if (!existingSenior) {
      await SeniorProfile.create({
        seniorId: 'S102',
        name: 'Savitri Devi',
        age: 74,
        gender: 'Female',
        bloodGroup: 'B+',
        phone: '+91 98765 00102',
        address: 'Villa 14, Green Valley Enclave, Madhapur, Hyderabad',
        location: {
          lat: 17.4435,
          lng: 78.3772,
          area: 'Madhapur, Hyderabad'
        },
        medicalConditions: ['Hypertension', 'Mild Osteoarthritis'],
        allergies: ['Penicillin'],
        emergencyContacts: [
          { name: 'Rohan Sharma', relation: 'Son', phone: '+91 98765 11111', isPrimary: true },
          { name: 'Dr. Ananya Sharma', relation: 'Daughter', phone: '+91 98765 22222', isPrimary: false }
        ],
        baselineVitals: {
          restingHeartRate: 72,
          typicalSpo2: 98
        },
        watchConnected: true
      });
      console.log('[IRIS Seed] Seeded Senior Profile: S102 (Savitri Devi)');
    }

    // 2. Seed Caretakers (Primary & Alternative)
    const caretakerCount = await Caretaker.countDocuments();
    if (caretakerCount === 0) {
      await Caretaker.create([
        {
          name: 'Ravi Kumar',
          phone: '+91 98123 45678',
          email: 'ravi.kumar@iriscare.org',
          availability: true,
          distanceKm: 2.1,
          etaMinutes: 6,
          skills: ['First-Aid Trained', 'CPR Certified', 'Elderly Mobility Specialist'],
          firstAidTrained: true,
          familiarityWithSenior: true,
          activeWorkload: 1,
          rating: 4.9,
          languages: ['Telugu', 'Hindi', 'English'],
          isAlternative: false
        },
        {
          name: 'Priya Sharma',
          phone: '+91 98234 56789',
          email: 'priya.sharma@iriscare.org',
          availability: true,
          distanceKm: 3.8,
          etaMinutes: 11,
          skills: ['Registered Nurse', 'Emergency Trauma Response', 'Cardiac Support'],
          firstAidTrained: true,
          familiarityWithSenior: true,
          activeWorkload: 0,
          rating: 4.95,
          languages: ['Telugu', 'English', 'Hindi'],
          isAlternative: true
        }
      ]);
      console.log('[IRIS Seed] Seeded Caretakers: Ravi Kumar (Primary) & Priya Sharma (Alternative)');
    }

    // 3. Seed Medicines
    const medicineCount = await Medicine.countDocuments();
    if (medicineCount === 0) {
      await Medicine.create([
        {
          seniorId: 'S102',
          name: 'Amlodipine',
          dosage: '5 mg',
          time: '08:00 AM',
          frequency: 'Daily',
          instructions: 'Take with warm water after breakfast',
          status: 'taken',
          lastTakenDate: new Date()
        },
        {
          seniorId: 'S102',
          name: 'Metformin',
          dosage: '500 mg',
          time: '01:30 PM',
          frequency: 'Daily',
          instructions: 'Take immediately after lunch',
          status: 'pending'
        },
        {
          seniorId: 'S102',
          name: 'Atorvastatin',
          dosage: '10 mg',
          time: '09:00 PM',
          frequency: 'Daily',
          instructions: 'Take before bedtime',
          status: 'pending'
        }
      ]);
      console.log('[IRIS Seed] Seeded Medicines');
    }

    // 4. Seed Appointments
    const appointmentCount = await Appointment.countDocuments();
    if (appointmentCount === 0) {
      await Appointment.create([
        {
          seniorId: 'S102',
          doctor: 'Dr. Ananya Rao',
          specialty: 'Cardiology',
          date: '22 Sept',
          time: '10:30 AM',
          location: 'City Hospital, Jubilee Hills',
          notes: 'Routine cardiovascular checkup and ECG review.',
          status: 'upcoming'
        },
        {
          seniorId: 'S102',
          doctor: 'Dr. K. Srinivas',
          specialty: 'Orthopedics',
          date: '28 Sept',
          time: '04:15 PM',
          location: 'Apollo Health City, Film Nagar',
          notes: 'Knee joint mobility and physical therapy evaluation.',
          status: 'upcoming'
        }
      ]);
      console.log('[IRIS Seed] Seeded Appointments');
    }

    // 5. Seed Family Check-In
    const checkInCount = await FamilyCheckIn.countDocuments();
    if (checkInCount === 0) {
      await FamilyCheckIn.create({
        seniorId: 'S102',
        familyMemberName: 'Ananya Sharma',
        relationship: 'Daughter',
        scheduledDay: 'Sunday',
        scheduledTime: '7:00 PM',
        title: 'Weekly family call',
        status: 'scheduled'
      });
      console.log('[IRIS Seed] Seeded Family Check-In');
    }

    // 6. Seed Demo Users with Secure Bcrypt Passwords & Account Lifecycle Status
    const bcrypt = require('bcryptjs');
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create([
        { name: 'Savitri Devi', email: 'senior@iris.care', passwordHash: defaultPasswordHash, role: 'senior', seniorId: 'S102', phone: '+91 98765 00102', status: 'ACTIVE', emailVerified: true, onboardingCompleted: true, isActive: true },
        { name: 'Rohan Sharma', email: 'family@iris.care', passwordHash: defaultPasswordHash, role: 'family', seniorId: 'S102', phone: '+91 98765 11111', status: 'ACTIVE', emailVerified: true, onboardingCompleted: true, isActive: true },
        { name: 'Ravi Kumar', email: 'caretaker@iris.care', passwordHash: defaultPasswordHash, role: 'caretaker', seniorId: 'S102', phone: '+91 98123 45678', status: 'ACTIVE', emailVerified: true, onboardingCompleted: true, isActive: true },
        { name: 'Admin Coordinator', email: 'admin@iris.care', passwordHash: defaultPasswordHash, role: 'admin', seniorId: 'S102', phone: '+91 98000 00000', status: 'ACTIVE', emailVerified: true, onboardingCompleted: true, isActive: true }
      ]);
      console.log('[IRIS Seed] Seeded Demo Users with Bcrypt Hashes (Password123!) & ACTIVE status');
    }

    // Seed Family Relationship for Demo Family User (Rohan Sharma <-> S102)
    const familyUser = await User.findOne({ email: 'family@iris.care' });
    if (familyUser) {
      const existingRel = await FamilyRelationship.findOne({ familyUserId: familyUser._id, seniorId: 'S102' });
      if (!existingRel) {
        await FamilyRelationship.create({
          familyUserId: familyUser._id,
          seniorId: 'S102',
          relationship: 'Son',
          accessLevel: 'FULL_CARE',
          status: 'APPROVED',
          inviteCode: 'IRIS-S102',
          approvedAt: new Date()
        });
        console.log('[IRIS Seed] Seeded Approved FamilyRelationship for Rohan Sharma -> S102');
      }
    }

    // 7. Seed Registered Smartwatch Device (Section 8 / Phase 4)
    const existingDevice = await Device.findOne({ deviceId: 'DEV-WATCH-S102' });
    if (!existingDevice) {
      await Device.create({
        deviceId: 'DEV-WATCH-S102',
        deviceType: 'simulator',
        seniorId: 'S102',
        status: 'active',
        batteryLevel: 94,
        lastSeen: new Date(),
        firmwareVersion: '1.4.2-telemetry',
        modelName: 'IRIS Wear OS Sense Pro'
      });
      console.log('[IRIS Seed] Seeded Registered Smartwatch Device: DEV-WATCH-S102');
    }

    // 8. Seed HIPAA/DISHA Baseline Consents (Phase 8)
    const consentCount = await Consent.countDocuments();
    if (consentCount === 0) {
      await Consent.create([
        { seniorId: 'S102', userEmail: 'senior@iris.care', purpose: 'WEARABLE_DATA', granted: true, version: '1.0', source: 'onboarding' },
        { seniorId: 'S102', userEmail: 'family@iris.care', purpose: 'FAMILY_ACCESS', granted: true, version: '1.0', source: 'onboarding' },
        { seniorId: 'S102', userEmail: 'caretaker@iris.care', purpose: 'CAREGIVER_ACCESS', granted: true, version: '1.0', source: 'onboarding' },
        { seniorId: 'S102', userEmail: 'senior@iris.care', purpose: 'LOCATION_SHARING', granted: true, version: '1.0', source: 'onboarding' },
        { seniorId: 'S102', userEmail: 'senior@iris.care', purpose: 'AI_PROCESSING', granted: true, version: '1.0', source: 'onboarding' }
      ]);
      console.log('[IRIS Seed] Seeded HIPAA/DISHA Baseline Consents for S102');
    }

    // 9. Seed Connect & Contribute Organizations
    const orgCount = await Organization.countDocuments();
    if (orgCount === 0) {
      await Organization.create([
        {
          name: 'Sunshine Children\'s Home',
          category: 'orphanage',
          description: 'A loving home for children aged 3-16, providing education, care, and a nurturing environment.',
          image: '👶',
          location: { address: '12, Banjara Hills Road No. 5', city: 'Hyderabad', lat: 17.4156, lng: 78.4347 },
          contactPhone: '+91 40 2335 1234',
          contactEmail: 'info@sunshinechildrenshome.org',
          activities: [
            { name: 'Teaching', icon: '📚', description: 'Help children with reading, writing, and basic math.', schedule: 'Mon, Wed, Fri — 10:00 AM to 12:00 PM' },
            { name: 'Storytelling', icon: '📖', description: 'Share stories and life experiences with the children.', schedule: 'Tue, Thu — 3:00 PM to 4:30 PM' },
            { name: 'Painting', icon: '🎨', description: 'Art sessions with children — drawing, colouring, and crafts.', schedule: 'Saturday — 10:00 AM to 12:00 PM' },
            { name: 'Music', icon: '🎵', description: 'Sing songs, teach instruments, or just enjoy music together.', schedule: 'Friday — 4:00 PM to 5:30 PM' },
            { name: 'Games', icon: '♟️', description: 'Board games, puzzles, and outdoor activities.', schedule: 'Daily — 5:00 PM to 6:00 PM' }
          ]
        },
        {
          name: 'Hope Children\'s Trust',
          category: 'orphanage',
          description: 'Empowering orphaned and underprivileged children through education and skill development.',
          image: '🌟',
          location: { address: '45, Jubilee Hills Check Post', city: 'Hyderabad', lat: 17.4310, lng: 78.4070 },
          contactPhone: '+91 40 2360 5678',
          contactEmail: 'contact@hopechildrenstrust.org',
          activities: [
            { name: 'Mentoring', icon: '👨‍🏫', description: 'Guide older children with career advice and life skills.', schedule: 'Wed, Sat — 11:00 AM to 1:00 PM' },
            { name: 'Teaching', icon: '📚', description: 'Assist with homework and exam preparation.', schedule: 'Mon to Fri — 4:00 PM to 6:00 PM' },
            { name: 'Cross Stitch', icon: '🧵', description: 'Teach traditional needlework and embroidery crafts.', schedule: 'Tuesday — 2:00 PM to 4:00 PM' },
            { name: 'Conversation', icon: '🗣️', description: 'Practise English conversation and communication skills.', schedule: 'Mon, Thu — 10:00 AM to 11:30 AM' }
          ]
        },
        {
          name: 'Helping Hands NGO',
          category: 'ngo',
          description: 'A community service organisation focused on uplifting underprivileged families through education and healthcare.',
          image: '🤝',
          location: { address: '78, Ameerpet Main Road', city: 'Hyderabad', lat: 17.4375, lng: 78.4483 },
          contactPhone: '+91 40 2374 9012',
          contactEmail: 'helpinghands@ngo.org',
          activities: [
            { name: 'Teaching', icon: '📚', description: 'Teach basic literacy and numeracy to community members.', schedule: 'Mon to Sat — 9:00 AM to 11:00 AM' },
            { name: 'Gardening', icon: '🌱', description: 'Help maintain the community garden and teach organic farming.', schedule: 'Wed, Sat — 7:00 AM to 9:00 AM' },
            { name: 'Storytelling', icon: '📖', description: 'Share wisdom and cultural stories at community gatherings.', schedule: 'Sunday — 10:00 AM to 12:00 PM' },
            { name: 'Conversation', icon: '🗣️', description: 'Spend time talking and listening to community elders.', schedule: 'Daily — Flexible hours' },
            { name: 'Music', icon: '🎵', description: 'Organise music and cultural events for the community.', schedule: 'Saturday — 5:00 PM to 7:00 PM' }
          ]
        },
        {
          name: 'Grace Old Age Home',
          category: 'old_age_home',
          description: 'A peaceful home for senior citizens providing companionship, care, and dignity in their golden years.',
          image: '👴',
          location: { address: '23, Begumpet', city: 'Hyderabad', lat: 17.4410, lng: 78.4710 },
          contactPhone: '+91 40 2776 3456',
          contactEmail: 'grace@oldagehome.org',
          activities: [
            { name: 'Conversation', icon: '🗣️', description: 'Spend quality time chatting with residents.', schedule: 'Daily — 10:00 AM to 12:00 PM' },
            { name: 'Games', icon: '♟️', description: 'Play chess, carrom, and card games with residents.', schedule: 'Daily — 3:00 PM to 5:00 PM' },
            { name: 'Music', icon: '🎵', description: 'Sing devotional songs or play instruments for residents.', schedule: 'Wed, Sun — 5:00 PM to 6:30 PM' },
            { name: 'Gardening', icon: '🌱', description: 'Tend the garden alongside residents who enjoy gardening.', schedule: 'Tue, Fri — 7:00 AM to 8:30 AM' },
            { name: 'Storytelling', icon: '📖', description: 'Exchange life stories and memories with residents.', schedule: 'Saturday — 4:00 PM to 5:30 PM' }
          ]
        }
      ]);
      console.log('[IRIS Seed] Seeded Connect & Contribute Sample Organizations');
    }
  } catch (error) {
    console.error('[IRIS Seed] Error seeding database:', error.message);
  }
}

module.exports = { seedInitialData };
