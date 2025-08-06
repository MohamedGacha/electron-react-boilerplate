export default function validateSetupJson(data: any): string | null {
  if (typeof data !== 'object' || data === null)
    return 'File is not a valid JSON object.';

  if (typeof data.carName !== 'string') return 'Missing or invalid "carName".';
  if (typeof data.basicSetup !== 'object' || data.basicSetup === null)
    return 'Missing or invalid "basicSetup".';
  if (typeof data.advancedSetup !== 'object' || data.advancedSetup === null)
    return 'Missing or invalid "advancedSetup".';
  if (typeof data.trackBopType !== 'number')
    return 'Missing or invalid "trackBopType".';

  // Example: check basicSetup.tyres
  if (
    !data.basicSetup.tyres ||
    typeof data.basicSetup.tyres.tyreCompound !== 'number' ||
    !Array.isArray(data.basicSetup.tyres.tyrePressure)
  ) {
    return 'Missing or invalid "basicSetup.tyres".';
  }

  // Add more checks as needed...

  return null; // valid
}
