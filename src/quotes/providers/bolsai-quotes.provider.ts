import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';

export interface BolsaiFundamentals{
    ticker: string;
    close_price: number;
    market_cap: number;
    pl: number | null;
    pvp: number | null;
    ev_ebitda: number | null;
    roe: number | null;
    roic: number | null;
    net_margin: number | null;
    gross_margin: number | null;
    net_debt_ebitda: number | null;
    lpa: number | null;
    vpa: number | null;
    ebitda: number | null;
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
            console.log(response.statusText)
            throw new HttpException(`Error fetching fundamentals for ticker ${ticker}`, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return response.json() as Promise<BolsaiFundamentals>;
    }
}