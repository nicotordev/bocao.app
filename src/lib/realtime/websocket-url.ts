export function buildKitchenWebSocketUrl(
  baseUrl: string,
  restaurantId: string,
  token: string,
) {
  const url = new URL(baseUrl);
  url.pathname = "/kitchen-ws";
  url.searchParams.set("restaurantId", restaurantId);
  url.searchParams.set("token", token);
  return url.toString();
}
