// PATH: /src/hooks/useStepValidation.js
// Direct translation of validate() from sp_steps.js

import { NATIONAL_ID_PIN_LENGTH } from '@/lib/constants';
import { providerAgeProblem } from '@/lib/validators';
import { completeEmail } from '@/lib/email';

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
      // Age comes first: nothing else matters if the applicant is under age.
      const ageProblem = providerAgeProblem(formData.date_of_birth);
      if (ageProblem) errors.unshift(ageProblem);

      if (!formData.sex)          errors.push('Please select your sex.');
      if (!formData.civil_status) errors.push('Please select your civil status.');
      const emailRegex = /\S+@\S+\.\S+/;
      if (formData.email && !emailRegex.test(completeEmail(formData.email))) {
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
      // National ID: the card number plus a photo of the front and the back.
      const cardNumber = formData.national_id_pin ?? '';
      if (!cardNumber) {
        errors.push('Please enter your National ID card number.');
      } else if (!/^\d+$/.test(cardNumber)) {
        errors.push('Your National ID card number must contain digits only.');
      } else if (cardNumber.length !== NATIONAL_ID_PIN_LENGTH) {
        errors.push(`Your National ID card number must be exactly ${NATIONAL_ID_PIN_LENGTH} digits.`);
      }

      if (!files?.file_national_id)      errors.push('Please upload a photo of the FRONT of your National ID.');
      if (!files?.file_national_id_back) errors.push('Please upload a photo of the BACK of your National ID.');

      if (!files?.file_photo)     errors.push('Please upload your 2×2 photo.');
      if (!formData.terms_agreed) errors.push('Please accept the certification checkbox.');
    }

    return errors; // empty array = valid
  }

  return { validateStep };
}