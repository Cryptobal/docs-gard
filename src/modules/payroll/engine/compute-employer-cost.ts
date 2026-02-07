/**
 * COMPUTE EMPLOYER COST
 * Calcula el costo mensual total del empleador (usado por CPQ)
 */

import type {
  EmployerCostInput,
  EmployerCostOutput,
  PayrollParameters,
  FxReferences,
} from "./types";
import {
  loadActiveParameters,
  loadParametersById,
  resolveFxReferences,
  createParametersSnapshot,
} from "./parameter-loader";
import { calculateTax } from "./tax-calculator";

export async function computeEmployerCost(
  input: EmployerCostInput
): Promise<EmployerCostOutput> {
  // 1. Cargar parámetros
  const paramsVersion = input.params_version_id
    ? await loadParametersById(input.params_version_id)
    : await loadActiveParameters();

  const params = paramsVersion.data;

  // 2. Resolver referencias FX (UF/UTM)
  const references = await resolveFxReferences(
    input.uf_value,
    input.uf_date,
    input.utm_value,
    input.utm_month
  );

  // 3. Configuración defaults
  const afp_name = input.afp_name || "habitat";
  const health_system = input.health_system || "fonasa";
  const health_plan_pct = input.health_plan_pct || 0.07;
  const work_injury_risk = input.work_injury_risk || "medium";

  const includeGratification = input.assumptions?.include_gratification !== false;
  const includeVacation = input.assumptions?.include_vacation_provision !== false;
  const includeSeverance = input.assumptions?.include_severance_provision !== false;

  const vacationPct = input.assumptions?.vacation_provision_pct || 0.0833;
  const severancePct = input.assumptions?.severance_provision_pct || 0.04166;

  // 4. Calcular topes en CLP
  const pension_cap_clp = params.caps.pension_uf * references.uf_clp;
  const afc_cap_clp = params.caps.afc_uf * references.uf_clp;

  // 5. Base salary
  const base_salary = input.base_salary_clp;

  // 6. Gratificación
  let gratification = 0;
  if (includeGratification) {
    const monthly_gratification = base_salary * params.gratification.regime_25_monthly.monthly_rate;
    const annual_cap = references.imm_clp * params.gratification.regime_25_monthly.annual_cap_imm_multiple;
    const monthly_cap = annual_cap / 12;
    gratification = Math.min(monthly_gratification, monthly_cap);
  }

  // 7. Total imponible (base + gratificación)
  const total_imponible = base_salary + gratification;
  const imponible_base = Math.min(total_imponible, pension_cap_clp);
  const afc_base = Math.min(total_imponible, afc_cap_clp);
  const afc_config =
    input.contract_type === "indefinite"
      ? params.afc.indefinite.employer
      : params.afc.fixed_term.employer;

  const afc_employer_cic = afc_base * afc_config.cic_rate;
  const afc_employer_fcs = afc_base * afc_config.fcs_rate;
  const afc_employer_total = afc_employer_cic + afc_employer_fcs;

  // 8. SIS Empleador
  const sis_employer = imponible_base * params.sis.employer_rate;

  // 9. Mutual/Accidentes del Trabajo
  let work_injury_base_rate: number;
  let work_injury_additional_rate: number;
  let work_injury_total_rate: number;

  if (input.assumptions?.work_injury_override?.total_rate) {
    work_injury_total_rate = input.assumptions.work_injury_override.total_rate;
    work_injury_base_rate = params.work_injury.base_rate;
    work_injury_additional_rate = work_injury_total_rate - work_injury_base_rate;
  } else if (input.assumptions?.work_injury_override) {
    const override = input.assumptions.work_injury_override;
    work_injury_base_rate = override.basic_rate || params.work_injury.base_rate;
    work_injury_additional_rate = (override.additional_rate || 0) + (override.extra_rate || 0);
    work_injury_total_rate = work_injury_base_rate + work_injury_additional_rate;
  } else {
    // Usar base_rate (0.93%) si existe, sino risk_levels
    work_injury_total_rate = params.work_injury.base_rate || params.work_injury.risk_levels?.[work_injury_risk] || 0.0093;
    work_injury_base_rate = params.work_injury.base_rate;
    work_injury_additional_rate = work_injury_total_rate - work_injury_base_rate;
  }

  const work_injury_employer = imponible_base * work_injury_total_rate;

  // 10. Costo directo
  const direct_cost =
    base_salary + gratification + sis_employer + afc_employer_total + work_injury_employer;

  // 11. Provisiones
  const vacation_provision = includeVacation ? direct_cost * vacationPct : 0;
  const severance_provision = includeSeverance ? direct_cost * severancePct : 0;

  // 12. Total costo empleador
  const total_cost = direct_cost + vacation_provision + severance_provision;

  // 13. Estimación descuentos trabajador (para cálculo líquido)
  // Base imponible para descuentos incluye gratificación
  const base_imponible_pension = Math.min(base_salary + gratification, pension_cap_clp);
  const base_imponible_afc = Math.min(base_salary + gratification, afc_cap_clp);
  
  const afp_commission = params.afp.commissions[afp_name]?.commission_rate || 0;
  const afp_total_rate = 0.1 + afp_commission;
  const afp_worker = base_imponible_pension * afp_total_rate;

  const health_rate = health_system === "fonasa" ? 0.07 : health_plan_pct;
  const health_worker = base_imponible_pension * health_rate;

  const afc_worker_config =
    input.contract_type === "indefinite"
      ? params.afc.indefinite.worker
      : params.afc.fixed_term.worker;
  const afc_worker = base_imponible_afc * afc_worker_config.total_rate;

  // Ingresos brutos incluyen gratificación
  const gross_income = base_salary + gratification;
  const taxable_base = gross_income - afp_worker - health_worker - afc_worker;
  const tax = calculateTax(taxable_base, params.tax_brackets);

  const total_deductions = afp_worker + health_worker + afc_worker + tax;
  const net_salary_estimate = gross_income - total_deductions;

  // 14. Crear snapshot
  const snapshot = createParametersSnapshot(
    paramsVersion.id,
    params.version_metadata.name,
    paramsVersion.effectiveFrom,
    paramsVersion.effectiveUntil,
    params,
    references
  );

  // 15. Return result
  return {
    monthly_employer_cost_clp: Math.round(total_cost * 100) / 100,
    breakdown: {
      base_salary: Math.round(base_salary * 100) / 100,
      gratification: Math.round(gratification * 100) / 100,
      overtime: 0, // TODO: Implementar horas extras
      total_taxable_income: Math.round((base_salary + gratification) * 100) / 100,
      
      // Haberes no imponibles
      transport_allowance: 0, // TODO: Implementar desde input
      meal_allowance: 0, // TODO: Implementar desde input
      family_allowance: 0, // TODO: Implementar asignación familiar
      total_non_taxable_income: 0,
      
      // Aportes empleador
      sis_employer: Math.round(sis_employer * 100) / 100,
      afc_employer: {
        cic: Math.round(afc_employer_cic * 100) / 100,
        fcs: Math.round(afc_employer_fcs * 100) / 100,
        total: Math.round(afc_employer_total * 100) / 100,
      },
      work_injury_employer: {
        base_rate: Math.round(work_injury_base_rate * 10000) / 10000,
        additional_rate: Math.round(work_injury_additional_rate * 10000) / 10000,
        total_rate: Math.round(work_injury_total_rate * 10000) / 10000,
        amount: Math.round(work_injury_employer * 100) / 100,
      },
      vacation_provision: Math.round(vacation_provision * 100) / 100,
      severance_provision: Math.round(severance_provision * 100) / 100,
      subtotal_direct_cost: Math.round(direct_cost * 100) / 100,
      total_cost: Math.round(total_cost * 100) / 100,
    },
    worker_breakdown_estimate: {
      afp: {
        base_rate: 0.1,
        commission_rate: afp_commission,
        total_rate: afp_total_rate,
        amount: Math.round(afp_worker * 100) / 100,
      },
      health: Math.round(health_worker * 100) / 100,
      afc: Math.round(afc_worker * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total_deductions: Math.round(total_deductions * 100) / 100,
    },
    worker_net_salary_estimate: Math.round(net_salary_estimate * 100) / 100,
    cost_to_net_ratio:
      Math.round((total_cost / net_salary_estimate) * 10000) / 100,
    parameters_snapshot: snapshot,
    computed_at: new Date().toISOString(),
  };
}
