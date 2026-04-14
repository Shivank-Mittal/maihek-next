/**
 * Delivery zones service.
 *
 * Currently returns a hardcoded list of allowed pincodes.
 * To plug in a real API later, replace the body of `fetchAllowedPincodes`
 * with a fetch() call to your endpoint and return the array it gives back.
 */

const HARDCODED_PINCODES = ["75001", "75002", "75003"];

export async function fetchAllowedPincodes(): Promise<string[]> {
  // TODO: replace with real API call, e.g.:
  // const res = await fetch("/api/v1/delivery-zones");
  // const data = await res.json();
  // return data.pincodes as string[];

  return HARDCODED_PINCODES;
}
