//ARCHIVO: auth.controller.ts
import { Controller, Post, Body, Get, Req, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { TokenPairDTO } from './dto/token-pair.dto';
import { AuthGuard } from './guards/auth.guard';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefreshToken } from './decorators/refresh-token.decorator';

@ApiTags('Auth') // Agrupa en Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /*
    → Este endpoint trabaja sobre el header, no sobre @Body, @Query, @Param, entonces NO necesita DTO.
    → Este endpoint NO va protegido con AuthGuard, porque es público (ver summary)
  */
  @ApiOperation({ summary: 'Cuando el access expira, el frontend usa este endpoint para, a través de un refresh token, obtener un nuevo access. Si el refresh también está por expirar, obtiene un nuevo access y un nuevo refresh.' })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @Get('tokens') 
  tokens(@RefreshToken() token: string){ 
    console.log('Generando nuevos tokens')
    return this.service.tokens(token);
  }

  @ApiOperation({ summary: 'Inicia sesión y obtiene tokens' })
  @ApiResponse({ status: 201, description: 'Access y Refresh tokens generados correctamente' })
  @Post('login')
  login(@Body() body: LoginDTO): Promise<TokenPairDTO> {
    console.log('Logueando al usuario ' + body.email)
    return this.service.login(body);
  }

  /*
    EJEMPLO
    /users/me es un endpoint de ejemplo creado para entender AuthGuard y el concepto de Requests.
    Las Requests en sí están explicadas en auth.guard, línea 55+
  */
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve los datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: RequestWithUser) {
    return {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    }
  }

}