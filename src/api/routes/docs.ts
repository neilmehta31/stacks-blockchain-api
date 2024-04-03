import { isProdEnv } from '@hirosystems/api-toolkit';
import { FastifyPluginCallback } from 'fastify';
import { Server } from 'http';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { ENV } from 'src/env';
import * as path from 'path';
import * as fs from 'fs';

export const DocsRoutes: FastifyPluginCallback<
  Record<never, never>,
  Server,
  TypeBoxTypeProvider
> = (fastify, options, done) => {
  fastify.get('/doc', async (req, reply) => {
    if (ENV.API_DOCS_URL) {
      return reply.redirect(ENV.API_DOCS_URL);
    } else if (!isProdEnv) {
      // use local documentation if serving locally
      const apiDocumentationPath = path.join(__dirname + '../../../docs/.tmp/index.html');
      if (fs.existsSync(apiDocumentationPath)) {
        const stream = fs.createReadStream('./index.html');
        await reply.type('text/html').send(stream);
        return;
      }
      const docNotFound = {
        error: 'Local documentation not found',
        desc: 'Please run the command: `npm run build:docs` and restart your server',
      };
      return reply.status(404).send(docNotFound);
    }
    // for production and no API_DOCS_URL provided
    const errObj = {
      error: 'Documentation is not available',
      desc: `You can still read documentation from https://docs.hiro.so/api`,
    };
    await reply.status(404).send(errObj);
  });
  done();
};
