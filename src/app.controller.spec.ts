import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should inject the AppService dependency through Nest', () => {
      expect(appController['appService']).toBeInstanceOf(AppService);
    });

    it('should support direct constructor instantiation with a mock service', () => {
      const mockService = {
        getHello: jest.fn().mockReturnValue('Direct hello'),
      } as unknown as AppService;

      const controller = new AppController(mockService);

      expect(controller.getHello()).toBe('Direct hello');
      expect(mockService.getHello).toHaveBeenCalledTimes(1);
    });

    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
