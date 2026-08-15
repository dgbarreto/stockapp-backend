import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { BolsaiQuotesProvider } from './providers/bolsai-quotes.provider';
import { QuoteHistoryRepository } from './quote-history.repository';
import { KnownTickersRepository } from 'src/known-tickers/known-tickers.repository';
import { DIVIDENDS_PROVIDER } from '../dividends/providers/dividends.provider';

describe('QuotesService', () => {
  let service: QuotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: BolsaiQuotesProvider, useValue: {} },
        { provide: QuoteHistoryRepository, useValue: {} },
        { provide: KnownTickersRepository, useValue: {} },
        { provide: DIVIDENDS_PROVIDER, useValue: {} },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
