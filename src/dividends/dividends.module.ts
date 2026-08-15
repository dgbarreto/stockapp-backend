import { Module } from '@nestjs/common';
import { DIVIDENDS_PROVIDER } from './providers/dividends.provider';
import { YahooDividendsProvider } from './providers/yahoo-dividends.provider';

@Module({
  providers: [
    { provide: DIVIDENDS_PROVIDER, useClass: YahooDividendsProvider },
  ],
  exports: [DIVIDENDS_PROVIDER],
})
export class DividendsModule {}
