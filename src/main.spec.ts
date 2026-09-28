describe('bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates the Nest application and listens on the default port', async () => {
    const listen = jest.fn().mockResolvedValue(undefined);
    const useGlobalPipes = jest.fn();

    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: jest.fn().mockResolvedValue({ listen, useGlobalPipes }),
      },
    }));

    jest.doMock('./prisma/client', () => ({
      prisma: {
        contactMessage: {
          findFirst: jest.fn(),
          create: jest.fn(),
        },
      },
    }));

    await jest.isolateModulesAsync(async () => {
      const { NestFactory } = require('@nestjs/core');
      const { AppModule } = require('./app.module');
      require('./main');

      await Promise.resolve();
      await Promise.resolve();

      expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
      expect(useGlobalPipes).toHaveBeenCalledWith(
        expect.objectContaining({
          validatorOptions: expect.objectContaining({
            whitelist: true,
            forbidNonWhitelisted: true,
          }),
        }),
      );
      expect(listen).toHaveBeenCalledWith(process.env.PORT ?? 3000);
    });
  });
});
