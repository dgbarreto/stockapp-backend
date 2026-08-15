import { Controller, Get } from '@nestjs/common';
import { importSPKI, exportJWK } from 'jose';

@Controller('.well-known')
export class JwksController {
  @Get('jwks.json')
  async getJwks() {
    const publicKey = await importSPKI(
      process.env.JWT_PUBLIC_KEY as string,
      'RS256',
    );
    const jwk = await exportJWK(publicKey);
    return {
      keys: [
        {
          ...jwk,
          kid: 'stockapp-backend-key-1',
          use: 'sig',
          alg: 'RS256',
        },
      ],
    };
  }
}
