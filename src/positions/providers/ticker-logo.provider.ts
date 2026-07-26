import { Injectable } from '@nestjs/common';

@Injectable()
export class TickerLogoProvider {
    private readonly bucket = 'stockapp-dgbarreto-logos';

    async getLogoUrl(ticker: string): Promise<string | null> {
        const objectName = `${ticker}.png`;
        const metadataUrl = `https://storage.googleapis.com/storage/v1/b/${this.bucket}/o/${objectName}`;

        const response = await fetch(metadataUrl);
        if (!response.ok) {
            return null;
        }

        return `https://storage.googleapis.com/${this.bucket}/${objectName}`;
    }
}