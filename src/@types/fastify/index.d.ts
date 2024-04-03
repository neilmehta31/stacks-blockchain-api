import fastify from 'fastify';
import { PgStore } from '../../datastore/pg-store';
import { PgWriteStore } from '../../datastore/pg-write-store';

declare module 'fastify' {
  export interface FastifyInstance<
    HttpServer = Server,
    HttpRequest = IncomingMessage,
    HttpResponse = ServerResponse,
    Logger = FastifyLoggerInstance,
    TypeProvider = FastifyTypeProviderDefault
  > {
    db: PgStore;
    writeDb?: PgWriteStore;
  }
}
