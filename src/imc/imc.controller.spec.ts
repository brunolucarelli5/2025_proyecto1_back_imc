import { Test, TestingModule } from '@nestjs/testing';
import { ImcController } from './imc.controller';
import { ImcService } from './imc.service';
import { CalculoImcDto } from './dto/calculo-imc.dto';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtService } from '../auth/jwt/jwt.service';
import { UsersService } from '../users/users.service';

describe('ImcController', () => {
  let controller: ImcController;
  let service: ImcService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockReq = {
    user: mockUser
  } as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImcController],
      providers: [
        {
          provide: ImcService,
          useValue: {
            calcularImc: jest.fn(),
          },
        },
        {
          provide: AuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {
            getPayload: jest.fn(),
            generateToken: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ImcController>(ImcController);
    service = module.get<ImcService>(ImcService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return IMC and category for valid input', async () => {
    const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
    jest
      .spyOn(service, 'calcularImc')
      .mockResolvedValue({ imc: 22.86, categoria: 'Normal' } as any);

    const result = await controller.calcular(dto, mockReq);
    expect(result).toEqual({ imc: 22.86, categoria: 'Normal' });
    expect(service.calcularImc).toHaveBeenCalledWith(dto, mockUser);
  });

  it('should throw BadRequestException for invalid input', async () => {
    const invalidDto: CalculoImcDto = { altura: -1, peso: 70 };

    // Aplicar ValidationPipe manualmente en la prueba
    const validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    await expect(
      validationPipe.transform(invalidDto, {
        type: 'body',
        metatype: CalculoImcDto,
      }),
    ).rejects.toThrow(BadRequestException);

    // Verificar que el servicio no se llama porque la validación falla antes
    expect(service.calcularImc).not.toHaveBeenCalled();
  });

  describe('Error handling and service integration', () => {
    it('should handle service errors and pass DTOs correctly', async () => {
      const dto: CalculoImcDto = { altura: 1.823, peso: 75.567 };
      const expectedResult = { imc: 22.73, categoria: 'Normal' };

      jest.spyOn(service, 'calcularImc').mockResolvedValue(expectedResult as any);
      const result = await controller.calcular(dto, mockReq);

      expect(service.calcularImc).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toBe(expectedResult);
    });

    it('should propagate service errors', async () => {
      const dto: CalculoImcDto = { altura: 1.75, peso: 70 };
      jest.spyOn(service, 'calcularImc').mockRejectedValue(new Error('Service error'));

      await expect(controller.calcular(dto, mockReq)).rejects.toThrow('Service error');
    });
  });

  describe('ValidationPipe integration', () => {
    it('should validate data correctly', async () => {
      const validationPipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      const validDto: CalculoImcDto = { altura: 1.75, peso: 70 };
      const transformedDto = await validationPipe.transform(validDto, {
        type: 'body',
        metatype: CalculoImcDto,
      });

      jest
        .spyOn(service, 'calcularImc')
        .mockResolvedValue({ imc: 22.86, categoria: 'Normal' } as any);
      const result = await controller.calcular(transformedDto as CalculoImcDto, mockReq);
      expect(result).toEqual({ imc: 22.86, categoria: 'Normal' });
    });

    it('should reject invalid data', async () => {
      const invalidDto = { altura: -1, peso: 600, extraField: 'invalid' };
      const validationPipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      await expect(
        validationPipe.transform(invalidDto, {
          type: 'body',
          metatype: CalculoImcDto,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
