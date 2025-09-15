import { ApiProperty } from "@nestjs/swagger";

export class TokenPairDTO {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImlnbmFtb3Njb25pQGdtYWlsLmNvbSIsImlhdCI6MTc1NzcyNjIyNywiZXhwIjoxNzU3NzI3MTI3fQ.OG2OqrVQhQCqynDHd7z3Zy8t2tsFS-WQTrLA5Ph0CzQ' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImlnbmFtb3Njb25pQGdtYWlsLmNvbSIsImlhdCI6MTc1NzcyNjExMSwiZXhwIjoxNzU3ODEyNTExfQ.aAEG5m6g1076tZHN1eT6LwEDHk7Ez8wuO9WanxsW8JI' })
  refreshToken: string;
}