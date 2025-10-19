import { PluggyClient } from "pluggy-sdk";

const clientId = process.env.PLUGGY_CLIENT_ID;
const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error(
    "Missing Pluggy credentials. Set PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET environment variables."
  );
}

const client = new PluggyClient({
  clientId,
  clientSecret,
});

export default client;
