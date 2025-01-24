export default async function fetchEnvVar(variableName) {
  try {
    const response = await fetch(`/.netlify/functions/getVariables?variableName=${variableName}`);
    const data = await response.json();
    return data[variableName];
  } catch (error) {
    console.error("Error fetching environment variable:", error);
    return null;
  }
}
