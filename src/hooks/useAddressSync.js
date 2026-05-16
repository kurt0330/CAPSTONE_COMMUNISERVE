// PATH: /src/hooks/useAddressSync.js
// Exact translation of form1.js jQuery logic → pure React

import { useCallback } from 'react';

/**
 * Returns a handler to call when the "same as permanent" checkbox changes.
 * Pass your React setState setters for the permanent address fields.
 *
 * Usage:
 *   const { handleSameAddress } = useAddressSync(presFields, setPermFields);
 */
export function useAddressSync(presFields, setPermFields) {
  const handleSameAddress = useCallback(
    (isChecked) => {
      if (isChecked) {
        setPermFields({
          perm_street:   presFields.pres_street,
          perm_barangay: presFields.pres_barangay,
          perm_city:     presFields.pres_city,
          perm_province: presFields.pres_province,
        });
      } else {
        setPermFields({
          perm_street:   '',
          perm_barangay: '',
          perm_city:     '',
          perm_province: '',
        });
      }
    },
    [presFields, setPermFields]
  );

  // Call this whenever a present-address field changes while sync is on
  const syncOnChange = useCallback(
    (field, value, isSynced) => {
      if (!isSynced) return;
      const permKey = field.replace('pres_', 'perm_');
      setPermFields((prev) => ({ ...prev, [permKey]: value }));
    },
    [setPermFields]
  );

  return { handleSameAddress, syncOnChange };
}