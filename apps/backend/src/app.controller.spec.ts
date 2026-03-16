import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController();
  });

  it('returns the health payload', () => {
    expect(controller.health()).toEqual({ status: 'ok' });
  });
});
