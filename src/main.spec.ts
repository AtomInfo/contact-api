describe('bootstrap', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates the Nest application and listens on the default port', async () => {
    const listen = jest.fn().mockResolvedValue(undefined);

    jest.doMock('@nestjs/core', () => ({
      NestFactory: {
        create: jest.fn().mockResolvedValue({ listen }),
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
      expect(listen).toHaveBeenCalledWith(process.env.PORT ?? 3000);
    });
  });
});
