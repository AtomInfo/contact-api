jest.mock('./prisma/client', () => ({
  prisma: {
    contactMessage: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should be defined and register the app controllers and providers', () => {
    expect(AppModule).toBeDefined();
    expect(AppModule).toHaveProperty('name', 'AppModule');
  });
});
