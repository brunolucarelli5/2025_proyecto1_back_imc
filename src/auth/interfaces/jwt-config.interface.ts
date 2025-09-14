export interface JwtConfigApp {
  jwt: JwtConfigTokens;
}

export interface JwtConfigTokens {
  access: JwtConfigSecret;
  refresh: JwtConfigSecret;
}

export interface JwtConfigSecret {
  secret: string;
  expiresIn: string;
}