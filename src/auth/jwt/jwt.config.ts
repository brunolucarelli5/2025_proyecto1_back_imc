//ARCHIVO: jwt.config.ts

import { JwtConfigApp } from "../interfaces/jwt-config.interface";

const jwtConfig = (): JwtConfigApp => ({
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET ?? '',
      expiresIn: process.env.JWT_ACCESS_EXPIRATION ?? '',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET ?? '',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION ?? '',
    },
  },
});

export default jwtConfig;