import { AwsRum, type AwsRumConfig } from "aws-rum-web";

try {
  const config: AwsRumConfig = {
    sessionSampleRate: 1 ,
    identityPoolId: "us-east-1:848c0c45-129c-4e32-a4af-39406a4e0a80" ,
    endpoint: "https://dataplane.rum.us-east-1.amazonaws.com" ,
    telemetries: ["performance","errors","http"] ,
    allowCookies: true ,
    enableXRay: false ,
    signing: true // If you have a public resource policy and wish to send unsigned requests please set this to false
  };

  const APPLICATION_ID: string = "ede893f2-1258-459e-aec5-483951d2dfb8";
  const APPLICATION_VERSION: string = "1.0.0";
  const APPLICATION_REGION: string = "us-east-1";

  new AwsRum(APPLICATION_ID, APPLICATION_VERSION, APPLICATION_REGION, config);
} catch (error) {
  // Ignore errors thrown during CloudWatch RUM web client initialization
}