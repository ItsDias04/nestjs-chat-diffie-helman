export interface FiatShamirKeys {
  p: number;
  q: number;
  n: number;
  s: number;
  v: number;
  timestamp: string;
  userId: string;
}

export interface FiatShamirSetupData {
  keys: FiatShamirKeys;
  instructions: string;
}