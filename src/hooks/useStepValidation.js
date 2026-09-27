// PATH: /src/hooks/useStepValidation.js
// Direct translation of validate() from sp_steps.js

import { NATIONAL_ID_PIN_LENGTH } from '@/lib/constants';

export function useStepValidation() {

  function validateStep(step, formData, files) {
    const errors = [];

    if (step === 1) {
      const required = [
        'last_name', 'first_name', 'date_of_birth',
        'pres_barangay', 'pres_city', 'pres_province', 'email',
      ];
      required.forEach((key) => {
        if (!formData[key]?.trim()) {
          errors.push(`${key.replace(/_/g, ' ')} is required.`);
        }
      });
      if (!formData.sex)          errors.push('Please select your sex.');
      if (!formData.civil_status) errors.push('Please select your civil status.');
      const emailRegex = /\S+@\S+\.\S+/;
      if (formData.email && !emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address.');
      }
    }

    if (step === 2) {
      if (!formData.employment_status) {
        errors.push('Please select your employment status.');
      }
    }

    if (step === 3) {
      if (!formData.trade_category) {
        errors.push('Please select a trade / service category.');
      }
    }

    // Step 4 always passes (admin-managed)
    if (step === 4) return [];

    if (step === 5) {
      // National ID is verified by PIN only — no photo upload (CAPSTONE_DOCS.md
      // §0.1 D-1 / BR-17).
      const pin = formData.national_id_pin ?? '';
      if (!pin) {
        errors.push('Please enter your National ID PIN.');
      } else if (!/^\d+$/.test(pin)) {
        errors.push('Your National ID PIN must contain digits only.');
      } else if (pin.length !== NATIONAL_ID_PIN_LENGTH) {
        errors.push(`Your National ID PIN must be exactly ${NATIONAL_ID_PIN_LENGTH} digits.`);
      }

      if (!files?.file_photo)     errors.push('Please upload your 2×2 photo.');
      if (!formData.terms_agreed) errors.push('Please accept the certification checkbox.');
    }

    return errors; // empty array = valid
  }

  return { validateStep };
}