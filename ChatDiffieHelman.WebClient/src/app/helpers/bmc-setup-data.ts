export interface BmcKeys {
  // Public parameters
  n: string; // modulus (decimal string)
  g: string; // generator (decimal string)
  y: string; // public key y = g^x mod n (decimal string)

  // Secret
  x: string; // secret exponent (decimal string)

  userId: string;
  timestamp: string;
}
