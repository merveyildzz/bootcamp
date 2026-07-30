export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
