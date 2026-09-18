const SeniorProfile = require('../models/SeniorProfile');
const Caretaker = require('../models/Caretaker');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const FamilyCheckIn = require('../models/FamilyCheckIn');
const User = require('../models/User');
const Device = require('../models/Device');
const Consent = require('../models/Consent');
const FamilyRelationship = require('../models/FamilyRelationship');

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
  } catch (error) {
    console.error('[IRIS Seed] Error seeding database:', error.message);
  }
}

module.exports = { seedInitialData };
