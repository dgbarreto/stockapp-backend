import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';

export interface BolsaiFundamentals{
    ticker: string;
    close_price: number;
    market_cap: number;
    pl: number;
    pvp: number;
    ev_ebitda: number;
    roe: number;
    roic: number;
    net_margin: number;
    gross_margin: number;
    dividend_yield: number;
    net_debt_ebitda: number;
    lpa: number;
    vpa: number;
    ebtida: number;
}

@Injectable()
export class BolsaiQuotesProvider {
    private readonly baseUrl: string = 'https://api.usebolsai.com';

    async getFundamentals(ticker: string): Promise<BolsaiFundamentals> {
        const response = await fetch(`${this.baseUrl}/api/v1/fundamentals/${ticker}`, {
            headers: { 'X-API-KEY': process.env.BOLSAI_API_KEY ?? '' }
        })

        if(response.status === 404) {
            throw new HttpException(`Ticker ${ticker} not found`, HttpStatus.NOT_FOUND);
        }

        if(!response.ok) {
            throw new HttpException(`Error fetching fundamentals for ticker ${ticker}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return response.json() as Promise<BolsaiFundamentals>;
    }
}