/**
 * Bolt Joint Physics Calculations
 *
 * This module provides physics calculations for bolted joint analysis,
 * including stress area calculation and force distribution analysis.
 */

const BoltPhysics = (function() {
  /**
   * Calculate stress area (As) from bolt diameter and thread pitch
   * Formula: As = 0.7854 × (d - 0.9382P)²
   * @param {number} d - Nominal bolt diameter [mm]
   * @param {number} P - Thread pitch [mm]
   * @returns {number} Stress area [mm²]
   */
  function calculateAs(d, P) {
    return 0.7854 * Math.pow(d - 0.9382 * P, 2);
  }

  /**
   * Calculate all bolt joint forces and deformations
   * @param {Object} params - Input parameters
   * @param {number} params.sigmaB - Bolt tensile strength [MPa]
   * @param {number} params.As - Stress area [mm²]
   * @param {number} params.Kb - Bolt stiffness [kN/mm]
   * @param {number} params.Kc - Clamped parts stiffness [kN/mm]
   * @param {number} params.preloadPercent - Preload as percentage of breaking load [%]
   * @param {number} params.externalForce - External axial force [kN]
   * @returns {Object} Calculated forces and deformations
   */
  function calculateJointForces({
    sigmaB,
    As,
    Kb,
    Kc,
    preloadPercent,
    externalForce
  }) {
    // Breaking load: σB × As (converted from N to kN)
    const breakingLoad = (sigmaB * As) / 1000;

    // Initial preload force
    const W0 = breakingLoad * (preloadPercent / 100);

    // Force ratio (load factor): φ = Kb / (Kb + Kc)
    // This determines how external force is distributed between bolt and clamped parts
    const phi = Kb / (Kb + Kc);

    // Change in bolt force due to external load
    const deltaWb = externalForce * phi;

    // Change in clamping force due to external load
    const deltaWc = externalForce * (1 - phi);

    // Final bolt force
    const Wb = W0 + deltaWb;

    // Final clamping force
    const Wc = W0 - deltaWc;

    // Initial bolt elongation at preload
    const deltaBolt0 = W0 / Kb;

    // Initial clamped parts compression at preload
    const deltaClamp0 = W0 / Kc;

    // Additional deformation due to external force
    const deltaDelta = externalForce / (Kb + Kc);

    // Safety checks
    const looseningDanger = Wc <= 0;  // Joint separation occurs
    const breakageDanger = Wb >= breakingLoad;  // Bolt fracture risk

    // Critical forces
    // Force required to cause joint separation (Wc = 0)
    const looseningForce = W0 / (1 - phi);

    // Force required to cause bolt fracture (Wb = breakingLoad)
    const breakageForce = (breakingLoad - W0) / phi;

    return {
      breakingLoad,
      W0,
      phi,
      deltaWb,
      deltaWc,
      Wb,
      Wc,
      deltaBolt0,
      deltaClamp0,
      deltaDelta,
      looseningDanger,
      breakageDanger,
      looseningForce,
      breakageForce
    };
  }

  /**
   * Process thread specifications from config
   * @param {Object} threads - Thread specifications from config
   * @returns {Object} Processed thread data with calculated As values
   */
  function processThreadSpecs(threads) {
    const processed = {};
    for (const [name, specs] of Object.entries(threads)) {
      processed[name] = {
        D: specs.D,
        d: specs.d,
        P: specs.P,
        As: calculateAs(specs.d, specs.P)
      };
    }
    processed['Custom'] = { D: null, d: null, P: null, As: null };
    return processed;
  }

  /**
   * Process material specifications from config
   * @param {Object} materials - Material specifications from config
   * @returns {Object} Processed material data with Custom option
   */
  function processMaterialSpecs(materials) {
    return {
      ...materials,
      Custom: { sigmaB: null, description: 'User defined', color: '#64748b' }
    };
  }

  // Public API
  return {
    calculateAs,
    calculateJointForces,
    processThreadSpecs,
    processMaterialSpecs
  };
})();
