import { Test, TestingModule } from '@nestjs/testing';
import { ChoferesService } from './choferes.service';

describe('ChoferesService', () => {
  let service: ChoferesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChoferesService],
    }).compile();

    service = module.get<ChoferesService>(ChoferesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
