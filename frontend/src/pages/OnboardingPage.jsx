import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  User,
  Heart,
  Users,
  HeartHandshake,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Phone,
  Activity,
  MapPin,
  Watch,
  Mic,
  Mail,
  Calendar,
  Building,
  Briefcase
} from 'lucide-react';

export default function OnboardingPage() {
  const { user, completeOnboarding, role } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const totalSteps = 7;
  const userRole = (role || user?.role || 'senior').toLowerCase();

  // Form State
  const [formData, setFormData] = useState({
    // Step 3: Personal Details
    fullName: '',
    email: '',
    phone: '',
    dob: '1952-08-15',
    gender: 'Female',
    maritalStatus: 'Widowed',
    address: 'Madhapur, Hyderabad',
    preferredLanguage: 'English',

    // Step 4: Senior Details
    emergencyContactName: 'Rohan Sharma',
    emergencyContactRelation: 'Son',
    emergencyContactPhone: '+91 98765 11111',
    bloodGroup: 'B+',
    accessibilityRequirements: 'Mobility Assistance',
    communicationPreferences: 'Voice Call',

    // Step 4: Family Details
    relationshipToSenior: 'Daughter',
    emergencyNotificationPref: 'PHONE',
    targetSeniorId: 'S102',
    seniorInviteCode: 'IRIS-S102',

    // Step 4: Caregiver Details
    experienceYears: '4',
    caregiverSkills: ['First Aid', 'Fall Assistance', 'Mobility Assistance', 'Medication Support'],
    availability: 'Full-Time',
    serviceArea: 'Madhapur & Hitec City',

    // Step 4: Provider Details
    professionalRole: 'Geriatric Specialist',
    specialization: 'Cardiovascular Care & Fall Prevention',
    organization: 'City Hospital, Jubilee Hills',
    practiceLocation: 'Hyderabad',
    licenseNumber: 'MCI-2021-98442',

    // Step 5: Care Network & Devices
    wearablePaired: true,
    voiceAssistance: true,
    voicePreference: 'English',
    locationSharingGateway: true,

    // Step 6: Consents
    locationSharingConsent: true,
    healthDataConsent: true,
    wearableConsent: true,
    aiProcessingConsent: true
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const caregiverSkillOptions = [
    'First Aid',
    'Fall Assistance',
    'Mobility Assistance',
    'Medication Support',
    'Elder Companionship',
    'Transportation Assistance',
    'Basic Health Monitoring',
    'Emergency Response'
  ];

  const handleToggleSkill = (skill) => {
    setFormData(prev => {
      const skills = prev.caregiverSkills || [];
      if (skills.includes(skill)) {
        return { ...prev, caregiverSkills: skills.filter(s => s !== skill) };
      } else {
        return { ...prev, caregiverSkills: [...skills, skill] };
      }
    });
  };

  const handleNext = async () => {
    setErrorMessage(null);

    // Autosave progress to backend
    try {
      await completeOnboarding({
        step: currentStep + 1,
        profileData: formData,
        complete: false
      });
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } catch (err) {
      console.warn('[IRIS Onboarding] Autosave notice:', err.message);
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const consentsList = [
        { purpose: 'LOCATION_SHARING', granted: formData.locationSharingConsent },
        { purpose: 'HEALTH_DATA_SHARING', granted: formData.healthDataConsent },
        { purpose: 'WEARABLE_DATA', granted: formData.wearableConsent },
        { purpose: 'AI_PROCESSING', granted: formData.aiProcessingConsent }
      ];

      const connectionData = userRole === 'family' ? {
        seniorId: formData.targetSeniorId,
        inviteCode: formData.seniorInviteCode,
        relationship: formData.relationshipToSenior
      } : null;

      const updatedUser = await completeOnboarding({
        step: 7,
        profileData: formData,
        complete: true,
        consents: consentsList,
        connectionData
      });

      setSuccessMessage('Profile setup complete! Entering your IRIS Care Network...');

      setTimeout(() => {
        const uRole = (updatedUser?.role || userRole).toLowerCase();
        if (uRole === 'senior') {
          navigate('/senior', { replace: true });
        } else if (uRole === 'caretaker' || uRole === 'caregiver') {
          navigate('/caretaker', { replace: true });
        } else if (uRole === 'healthcare_provider' || uRole === 'provider') {
          navigate('/provider', { replace: true });
        } else if (uRole === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/family', { replace: true });
        }
      }, 1000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to complete profile setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    'Account Details',
    'Role Scope',
    'Personal Details',
    'Role Details',
    'Care Network',
    'Privacy & Consent',
    'Complete'
  ];

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 bg-surface-warm">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl shadow-stone-200/50 space-y-6 animate-in fade-in duration-300">
        {/* Step Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-2">
            <span>
              STEP {currentStep} OF {totalSteps}: <strong className="text-charcoal-900">{stepTitles[currentStep - 1]}</strong>
            </span>
            <span className="capitalize font-mono text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Role: {userRole.replace('_', ' ')}
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2">
            <div
              className="bg-teal-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Account Confirmation */}
        {currentStep === 1 && (
          <div className="space-y-4 text-xs">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-charcoal-900">Welcome to IRIS Care</h2>
              <p className="text-stone-500 mt-1">Let's verify your authenticated identity and account details.</p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Full Name</span>
                <span className="font-bold text-stone-900">{user?.name || 'Care Network Member'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Email Address</span>
                <span className="font-mono text-stone-900">{user?.email || 'user@iris.care'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Care Network Role</span>
                <span className="font-bold uppercase tracking-wider text-teal-700">{userRole.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Assigned Senior Care Scope</span>
                <span className="font-mono text-stone-900">{user?.seniorId || 'S102'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Onboarding Journey:</strong> In the next steps, we will calibrate your personal profile, role permissions, care network linkage, and data consents.
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Role Confirmation */}
        {currentStep === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900">Role Confirmation & Network Scope</h2>
              <p className="text-stone-500 mt-1">Review the access boundaries and care duties for your role.</p>
            </div>

            <div className="p-5 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-3">
              <div className="flex items-center gap-3">
                {userRole === 'senior' && <User className="w-6 h-6 text-teal-700" />}
                {userRole === 'family' && <Users className="w-6 h-6 text-blue-700" />}
                {(userRole === 'caretaker' || userRole === 'caregiver') && <HeartHandshake className="w-6 h-6 text-amber-700" />}
                {(userRole === 'healthcare_provider' || userRole === 'provider') && <Stethoscope className="w-6 h-6 text-purple-700" />}
                <div>
                  <div className="font-bold text-base text-charcoal-900 capitalize">
                    {userRole.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-stone-500">Authorized Care Persona</div>
                </div>
              </div>

              <div className="pt-2 border-t border-teal-100 text-stone-700 leading-relaxed">
                {userRole === 'senior' && (
                  <p>As a Senior Citizen, you have complete control over your own vital data, emergency escalation preferences, and designated care network members.</p>
                )}
                {userRole === 'family' && (
                  <p>As a Family Member, you receive peace-of-mind alerts, continuous telemetry from authorized seniors, and unalterable incident timeline records.</p>
                )}
                {(userRole === 'caretaker' || userRole === 'caregiver') && (
                  <p>As a Caregiver, you are matched for proximity emergency response and day-to-day assistance. Note: Administrative verification is completed prior to dispatch assignment.</p>
                )}
                {(userRole === 'healthcare_provider' || userRole === 'provider') && (
                  <p>As a Healthcare Provider, you review clinical anomaly triage dossiers and coordinate medical treatments under strict HIPAA/DISHA consent controls.</p>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-stone-600 flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-500 shrink-0" />
              <span>Role security is enforced cryptographically on the IRIS server. Unauthorized privilege escalation is strictly prohibited.</span>
            </div>
          </div>
        )}

        {/* STEP 3: Personal Details */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900">Personal Information</h2>
              <p className="text-stone-500 mt-1">Provide demographic and contact information for care coordination.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Savitri Devi"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Contact Mobile Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Marital Status</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Widowed">Widowed</option>
                  <option value="Married">Married</option>
                  <option value="Single">Single</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Preferred Language</label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="English">English</option>
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1.5">Residential Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Villa 14, Green Valley Enclave, Madhapur"
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Role-Specific Details */}
        {currentStep === 4 && (
          <div className="space-y-4 text-xs">
            {/* SENIOR ROLE */}
            {userRole === 'senior' && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900">Senior Care & Emergency Setup</h2>
                  <p className="text-stone-500 mt-1">Specify your emergency contact and medical details (designed simple for seniors).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Relationship</label>
                    <input
                      type="text"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                      placeholder="Son / Daughter"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Emergency Phone</label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Blood Group (Optional)</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm"
                    >
                      <option value="B+">B+</option>
                      <option value="A+">A+</option>
                      <option value="O+">O+</option>
                      <option value="AB+">AB+</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1.5">Accessibility Support</label>
                  <select
                    value={formData.accessibilityRequirements}
                    onChange={(e) => setFormData({ ...formData, accessibilityRequirements: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                  >
                    <option value="Mobility Assistance">Mobility Assistance (Walking stick / Wheelchair)</option>
                    <option value="Hearing Support">Hearing Support</option>
                    <option value="Vision Support">Vision Support</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </>
            )}

            {/* FAMILY ROLE */}
            {userRole === 'family' && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900">Connect to a Senior</h2>
                  <p className="text-stone-500 mt-1">Establish connection to your senior loved one using their authorized invite code.</p>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>Unrestricted access to seniors is prohibited. Connection requires passphrase authorization.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Target Senior ID</label>
                    <input
                      type="text"
                      value={formData.targetSeniorId}
                      onChange={(e) => setFormData({ ...formData, targetSeniorId: e.target.value })}
                      placeholder="e.g. S102"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Invitation / Passphrase Code</label>
                    <input
                      type="text"
                      value={formData.seniorInviteCode}
                      onChange={(e) => setFormData({ ...formData, seniorInviteCode: e.target.value })}
                      placeholder="e.g. IRIS-S102"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Relationship to Senior</label>
                    <select
                      value={formData.relationshipToSenior}
                      onChange={(e) => setFormData({ ...formData, relationshipToSenior: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                    >
                      <option value="Daughter">Daughter</option>
                      <option value="Son">Son</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Grandchild">Grandchild</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Emergency Escalation Channel</label>
                    <select
                      value={formData.emergencyNotificationPref}
                      onChange={(e) => setFormData({ ...formData, emergencyNotificationPref: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                    >
                      <option value="PHONE">Direct Voice Phone Call</option>
                      <option value="SMS">High-Priority SMS</option>
                      <option value="PUSH">App Push Notification</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* CAREGIVER ROLE */}
            {(userRole === 'caretaker' || userRole === 'caregiver') && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900">Caregiver Credentials & Skills</h2>
                  <p className="text-stone-500 mt-1">Specify clinical skills, response capability, and service perimeter.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Caregiving Experience (Years)</label>
                    <input
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Availability Status</label>
                    <select
                      value={formData.availability}
                      onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                    >
                      <option value="Full-Time">Full-Time (24/7 Response)</option>
                      <option value="Part-Time">Daytime Shifts</option>
                      <option value="On-Call">On-Call Emergency Responder</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1.5">Designated Service Area</label>
                  <input
                    type="text"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                    placeholder="e.g. Madhapur & Hitec City"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-2">Verified Competencies & Skills</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {caregiverSkillOptions.map((skill) => {
                      const selected = (formData.caregiverSkills || []).includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleToggleSkill(skill)}
                          className={`p-2 rounded-xl border text-[11px] font-medium transition text-left ${
                            selected
                              ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold ring-1 ring-teal-400'
                              : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '}{skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Credential Verification: Caregiver registrations require administrative review before senior dispatch assignment.</span>
                </div>
              </>
            )}

            {/* HEALTHCARE PROVIDER ROLE */}
            {(userRole === 'healthcare_provider' || userRole === 'provider') && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900">Healthcare Provider Verification</h2>
                  <p className="text-stone-500 mt-1">Submit your medical license, hospital affiliation, and clinical details.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Professional Role / Title</label>
                    <input
                      type="text"
                      value={formData.professionalRole}
                      onChange={(e) => setFormData({ ...formData, professionalRole: e.target.value })}
                      placeholder="e.g. Geriatric Specialist, MD"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Medical Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g. Cardiovascular Care"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Medical License / MCI Registration No.</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="MCI-XXXX-XXXX"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1.5">Affiliated Hospital / Organization</label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="City Hospital, Jubilee Hills"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-purple-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Clinical Provider Status: Registration is placed in PENDING_VERIFICATION until medical credentials are confirmed.</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 5: Care Network & Devices */}
        {currentStep === 5 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900">Care Network & Device Integrations</h2>
              <p className="text-stone-500 mt-1">Configure hardware integrations, telemetry streams, and voice interactions.</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Watch className="w-5 h-5 text-teal-700" />
                  <div>
                    <div className="font-bold text-charcoal-900">Pair IRIS Wear OS Smartwatch</div>
                    <div className="text-stone-500 text-[11px]">Enables continuous heart-rate and autonomous fall detection telemetry.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.wearablePaired}
                  onChange={(e) => setFormData({ ...formData, wearablePaired: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-teal-700" />
                  <div>
                    <div className="font-bold text-charcoal-900">Voice Assistant & Spoken Reminders</div>
                    <div className="text-stone-500 text-[11px]">Enables conversational medicine prompts and spoken guidance.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.voiceAssistance}
                  onChange={(e) => setFormData({ ...formData, voiceAssistance: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-teal-700" />
                  <div>
                    <div className="font-bold text-charcoal-900">Proximity Dispatch Gateway</div>
                    <div className="text-stone-500 text-[11px]">Enables GPS dispatch to emergency responders during critical incidents.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.locationSharingGateway}
                  onChange={(e) => setFormData({ ...formData, locationSharingGateway: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Consents & Privacy */}
        {currentStep === 6 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900">Consent & Privacy Governance</h2>
              <p className="text-stone-500 mt-1">Compliant with HIPAA and DISHA senior digital health standards.</p>
            </div>

            <div className="space-y-3">
              <label className="p-4 rounded-2xl border border-stone-200 flex items-start gap-3 cursor-pointer hover:bg-stone-50/50 transition">
                <input
                  type="checkbox"
                  checked={formData.healthDataConsent}
                  onChange={(e) => setFormData({ ...formData, healthDataConsent: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded mt-0.5"
                />
                <div>
                  <div className="font-bold text-charcoal-900">Health Telemetry Data Sharing</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Allow designated family members and assigned emergency responders to view live vitals during routine and emergency states.
                  </div>
                </div>
              </label>

              <label className="p-4 rounded-2xl border border-stone-200 flex items-start gap-3 cursor-pointer hover:bg-stone-50/50 transition">
                <input
                  type="checkbox"
                  checked={formData.locationSharingConsent}
                  onChange={(e) => setFormData({ ...formData, locationSharingConsent: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded mt-0.5"
                />
                <div>
                  <div className="font-bold text-charcoal-900">Emergency Geolocation Transmission</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Allow GPS dispatch transmission to emergency responders (Level 3 108 EMS & Caregivers) when a fall is detected.
                  </div>
                </div>
              </label>

              <label className="p-4 rounded-2xl border border-stone-200 flex items-start gap-3 cursor-pointer hover:bg-stone-50/50 transition">
                <input
                  type="checkbox"
                  checked={formData.aiProcessingConsent}
                  onChange={(e) => setFormData({ ...formData, aiProcessingConsent: e.target.checked })}
                  className="w-4 h-4 text-teal-600 rounded mt-0.5"
                />
                <div>
                  <div className="font-bold text-charcoal-900">Clinical AI & Gemini Risk Analysis</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Allow HIPAA-anonymized telemetry analysis by Google Gemini Clinical AI for automated vital anomaly triage.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 7: Complete & Enter */}
        {currentStep === 7 && (
          <div className="space-y-5 text-center sm:text-left text-xs">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-900">Setup Complete!</h2>
              <p className="text-stone-500 mt-1">Your IRIS profile has been verified and registered.</p>
            </div>

            <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3 text-left">
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Name</span>
                <span className="font-bold text-stone-900">{formData.fullName || user?.name}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Care Network Role</span>
                <span className="font-bold text-teal-800 uppercase">{userRole.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500">Verification Status</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                  userRole === 'caretaker' || userRole === 'healthcare_provider'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {userRole === 'caretaker' || userRole === 'healthcare_provider' ? 'Pending Review' : 'Verified Active'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Finalizing Profile...' : 'Enter IRIS Care Network →'}
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 7 && (
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div></div>}

            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
