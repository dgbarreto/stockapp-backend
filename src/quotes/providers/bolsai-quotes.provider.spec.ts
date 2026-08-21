import { Test, TestingModule } from '@nestjs/testing';
import { BolsaiQuotesProvider } from './bolsai-quotes.provider';
import { RedisCacheService } from '../../cache/redis-cache.service';

describe('BolsaiQuotesProvider', () => {
  let provider: BolsaiQuotesProvider;
  let cache: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    cache = { get: jest.fn(), set: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BolsaiQuotesProvider,
        { provide: RedisCacheService, useValue: cache },
      ],
    }).compile();

    provider = module.get<BolsaiQuotesProvider>(BolsaiQuotesProvider);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns cached fundamentals without calling fetch on cache hit', async () => {
    const cached = { ticker: 'PETR4', close_price: 30 };
    cache.get.mockResolvedValue(cached);
    const fetchSpy = jest.spyOn(global, 'fetch');

    const result = await provider.getFundamentals('PETR4');

    expect(result).toEqual(cached);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('fetches from bolsai and stores in cache on cache miss', async () => {
    cache.get.mockResolvedValue(null);
    const apiResponse = { ticker: 'PETR4', close_price: 30 };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => apiResponse,
    } as Response);

    const result = await provider.getFundamentals('PETR4');

    expect(result).toEqual(apiResponse);
    expect(cache.set).toHaveBeenCalledWith(
      'bolsai:fundamentals:PETR4',
      apiResponse,
      6 * 60 * 60,
    );
  });
});