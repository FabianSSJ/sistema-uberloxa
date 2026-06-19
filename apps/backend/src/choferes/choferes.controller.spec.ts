import { Test, TestingModule } from '@nestjs/testing';
import { ChoferesController } from './choferes.controller';

describe('ChoferesController', () => {
  let controller: ChoferesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChoferesController],
    }).compile();

    controller = module.get<ChoferesController>(ChoferesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
