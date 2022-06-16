import { FirebaseApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const getCustomAuthToken = async (app: FirebaseApp): Promise<string> => {
  const functions = getFunctions(app);
  const getCustomAuthTokenCloudFunction = httpsCallable(
    functions,
    "getCustomAuthToken"
  );
  const result = await getCustomAuthTokenCloudFunction();
  const data = result.data as any;
  const customAuthToken = data.customAuthToken!;
  return customAuthToken;
};

export default getCustomAuthToken;
