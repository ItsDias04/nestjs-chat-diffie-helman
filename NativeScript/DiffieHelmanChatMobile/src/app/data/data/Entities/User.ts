export interface User {
  id: string;
  email: string;
  name: string;
  fiat_enabled: boolean;
  bmc_enabled?: boolean;
  bmc_n?: string | null;
  bmc_g?: string | null;
  bmc_y?: string | null;

  // другие поля пользователя
}
