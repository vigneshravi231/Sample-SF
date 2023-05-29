
export const makeLabel = (maybeAddress) => {
  const address = maybeAddress.Address ?? maybeAddress;
  return `${address.street} ${address.city}, ${address.state} ${address.postalCode} ${address.country}`;
};
