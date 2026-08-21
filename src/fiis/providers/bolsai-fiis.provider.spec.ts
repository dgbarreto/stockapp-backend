import { Test, TestingModule } from '@nestjs/testing';
import { BolsaiFiisProvider } from './bolsai-fiis.provider';
import { RedisCacheService } from '../../cache/redis-cache.service';

describe('BolsaiFiisProvider', () => {
  let provider: BolsaiFiisProvider;
  let cache: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    cache = { get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BolsaiFiisProvider,
        { provide: RedisCacheService, useValue: cache },
      ],
    }).compile();

    provider = module.get<BolsaiFiisProvider>(BolsaiFiisProvider);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns cached FII without calling fetch on cache hit', async () => {
    const cached = { ticker: 'HGLG11', close_price: 160 };
    cache.get.mockResolvedValue(cached);
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await provider.getFii('HGLG11');

    expect(result).toEqual(cached);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('fetches from bolsai and stores in cache on cache miss', async () => {
    cache.get.mockResolvedValue(null);
    const apiResponse = { ticker: 'HGLG11', close_price: 160 };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(apiResponse),
    } as Response);

    const result = await provider.getFii('HGLG11');

    expect(result).toEqual(apiResponse);
    expect(cache.set).toHaveBeenCalledWith(
      'bolsai:fiis:HGLG11',
      apiResponse,
      6 * 60 * 60,
    );
  });
});
