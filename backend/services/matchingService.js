const Caretaker = require('../models/Caretaker');

/**
 * Match the optimal caretaker for an emergency based on availability,
 * proximity, skill qualifications, and familiarity.
 *
 * @param {Object} emergency
 * @param {ObjectId} excludeCaretakerId Optional caretaker ID to skip (for reassessment fallback)
 */
async function findBestResponder(emergency, excludeCaretakerId = null) {
  const query = { availability: true };
  if (excludeCaretakerId) {
    query._id = { $ne: excludeCaretakerId };
  }

  let caretakers = await Caretaker.find(query);

  if (!caretakers || caretakers.length === 0) {
    // Fallback to any caretaker if strict availability yields empty
    caretakers = await Caretaker.find(excludeCaretakerId ? { _id: { $ne: excludeCaretakerId } } : {});
  }

  if (!caretakers || caretakers.length === 0) {
    return null;
  }

  // Score each candidate
  const scored = caretakers.map((c) => {
    let score = 100;
    const reasons = [];

    if (c.availability) {
      score += 30;
      reasons.push('Available for immediate dispatch');
    }

    if (c.firstAidTrained) {
      score += 25;
      reasons.push('First-aid trained & CPR certified');
    }

    if (c.familiarityWithSenior) {
      score += 20;
      reasons.push('Familiar with senior profile & health history');
    }

    // Distance penalty (closer is better)
    const dist = c.distanceKm || 2.5;
    score -= dist * 5;
    reasons.push(`${dist.toFixed(1)} km away (ETA: ~${c.etaMinutes || Math.round(dist * 3)} min)`);

    // Workload penalty
    if (c.activeWorkload > 0) {
      score -= c.activeWorkload * 10;
    } else {
      reasons.push('Zero active competing emergencies');
    }

    return {
      caretaker: c,
      score,
      reasons
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored[0];
}

module.exports = { findBestResponder };
