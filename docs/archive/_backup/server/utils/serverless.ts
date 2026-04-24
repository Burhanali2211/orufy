// Utility to detect serverless deployment environments (Vercel, AWS Lambda, etc.)
export function isServerless(): boolean {
  return (
    process.env.IS_SERVERLESS === 'true' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    typeof process.env.AWS_LAMBDA_FUNCTION_NAME !== 'undefined' ||
    typeof process.env.FUNCTIONS_RUNTIME !== 'undefined' ||
    typeof process.env.FUNCTIONS_WORKER_RUNTIME !== 'undefined'
  );
}

export default isServerless;
