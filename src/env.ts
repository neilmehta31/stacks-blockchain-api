import { Static, Type } from '@sinclair/typebox';
import envSchema from 'env-schema';

const schema = Type.Object({
  /**
   * If specified, controls the Stacks Blockchain API mode. The possible values are:
   * * `readonly`: Runs the API endpoints without an Event Server that listens to events from a node
   *    and writes them to the local database. The API will only read data from the PG database
   *    specified above to respond to requests.
   * * `writeonly`: Runs the Event Server without API endpoints. Useful when looking to query the
   *    postgres database containing blockchain data exclusively without the overhead of a web
   *    server.
   * * `offline`: Run the API endpoints without a stacks-node or postgres connection. In this mode,
   *    only the given Rosetta endpoints are supported:
   *    https://www.rosetta-api.org/docs/node_deployment.html#offline-mode-endpoints
   *
   * If not specified or any other value is provided, the API will run in the default `read-write`
   * mode (with both Event Server and API endpoints).
   */
  STACKS_API_MODE: Type.Enum(
    { default: 'default', readonly: 'readonly', writeonly: 'writeonly', offline: 'offline' },
    { default: 'default' }
  ),

  PG_HOST: Type.String({ default: '127.0.0.1' }),
  PG_PORT: Type.Integer({ default: 5432, minimum: 0, maximum: 65535 }),
  PG_USER: Type.String({ default: 'postgres' }),
  PG_PASSWORD: Type.String({ default: 'postgres' }),
  PG_DATABASE: Type.String({ default: 'stacks_blockchain_api' }),
  PG_SCHEMA: Type.String({ default: 'public' }),
  PG_SSL: Type.Boolean({ default: false }),
  /** Idle connection timeout in seconds */
  PG_IDLE_TIMEOUT: Type.Integer({ default: 30 }),
  /** Max connection lifetime in seconds */
  PG_MAX_LIFETIME: Type.Integer({ default: 60 }),
  /** Seconds before force-ending running queries on connection close */
  PG_CLOSE_TIMEOUT: Type.Integer({ default: 5 }),
  /** Limit to how many concurrent connections can be created */
  PG_CONNECTION_POOL_MAX: Type.Integer({ default: 10 }),
  /** Can be any string, use to specify a use case specific to a deployment */
  PG_APPLICATION_NAME: Type.String({ default: 'stacks-blockchain-api' }),
  /** The connection URI below can be used in place of the PG variables above. */
  PG_CONNECTION_URI: Type.Optional(Type.String()),

  // If your PG deployment implements a combination of primary server and read replicas, you should
  // specify the values below to point to the primary server. The API will use primary when
  // implementing LISTEN/NOTIFY postgres messages for websocket/socket.io support. To avoid any data
  // inconsistencies across replicas, make sure to set `synchronous_commit` to `on` or
  // `remote_apply` on the primary database's configuration. See
  // https://www.postgresql.org/docs/12/runtime-config-wal.html
  //
  // Any value not provided here will fall back to the default equivalent above.

  PG_PRIMARY_HOST: Type.Optional(Type.String()),
  PG_PRIMARY_PORT: Type.Optional(Type.Integer({ default: 5432, minimum: 0, maximum: 65535 })),
  PG_PRIMARY_USER: Type.Optional(Type.String()),
  PG_PRIMARY_PASSWORD: Type.Optional(Type.String()),
  PG_PRIMARY_DATABASE: Type.Optional(Type.String()),
  PG_PRIMARY_SCHEMA: Type.Optional(Type.String()),
  PG_PRIMARY_SSL: Type.Optional(Type.Boolean({ default: false })),
  PG_PRIMARY_IDLE_TIMEOUT: Type.Optional(Type.Integer({ default: 30 })),
  PG_PRIMARY_MAX_LIFETIME: Type.Optional(Type.Integer({ default: 60 })),
  PG_PRIMARY_CLOSE_TIMEOUT: Type.Optional(Type.Integer({ default: 5 })),
  PG_PRIMARY_CONNECTION_POOL_MAX: Type.Optional(Type.Integer({ default: 10 })),
  PG_PRIMARY_CONNECTION_URI: Type.String(),

  /**
   * Insert concurrency when processing new blocks. If your PostgreSQL is operating on SSD and has
   * multiple CPU cores, consider raising this value, for instance, to 8 or 16.
   */
  STACKS_BLOCK_DATA_INSERT_CONCURRENCY: Type.Integer({ default: 4 }),

  /**
   * To avoid running unnecessary mempool stats during transaction influx, we use a debounce
   * mechanism for the process. This variable controls the duration it waits until there are no
   * further mempool updates
   */
  MEMPOOL_STATS_DEBOUNCE_INTERVAL: Type.Integer({ default: 1000 }),
  MEMPOOL_STATS_DEBOUNCE_MAX_INTERVAL: Type.Integer({ default: 10_000 }),

  /**
   * If specified, an http server providing profiling capability endpoints will be opened on the
   * given port. This port should not be publicly exposed.
   */
  STACKS_PROFILER_PORT: Type.Integer({ default: 9119 }),

  STACKS_CORE_EVENT_HOST: Type.String({ default: '127.0.0.1' }),
  STACKS_CORE_EVENT_PORT: Type.Integer({ default: 3700, minimum: 0, maximum: 65535 }),

  STACKS_BLOCKCHAIN_API_HOST: Type.String({ default: '127.0.0.1' }),
  STACKS_BLOCKCHAIN_API_PORT: Type.Integer({ default: 3999, minimum: 0, maximum: 65535 }),

  STACKS_CORE_RPC_HOST: Type.String({ default: '127.0.0.1' }),
  STACKS_CORE_RPC_PORT: Type.Integer({ default: 20443, minimum: 0, maximum: 65535 }),

  STACKS_FAUCET_NODE_HOST: Type.Optional(Type.String()),
  STACKS_FAUCET_NODE_PORT: Type.Optional(Type.Integer({ minimum: 0, maximum: 65535 })),

  /** Configure the chainID/networkID; testnet: 0x80000000, mainnet: 0x00000001 */
  STACKS_CHAIN_ID: Type.String({ default: '0x00000001' }),

  /**
   * Configure custom testnet and mainnet chainIDs for other networks such as subnets, multiple
   * values can be set using comma-separated key-value pairs.
   *
   * TODO: currently configured with the default subnet testnet ID, the mainnet values are
   * placeholders that should be replaced with the actual subnet mainnet chainID
   * CUSTOM_CHAIN_IDS=testnet=0x55005500,mainnet=12345678,mainnet=0xdeadbeaf
   */
  CUSTOM_CHAIN_IDS: Type.Optional(Type.String()),

  /**
   * If enabled, the API will skip the startup validation request to the stacks-node /v2/info RPC
   * endpoint
   */
  SKIP_STACKS_CHAIN_ID_CHECK: Type.Boolean({ default: true }),

  /** Seconds to allow API components to shut down gracefully before force-killing them */
  STACKS_SHUTDOWN_FORCE_KILL_TIMEOUT: Type.Integer({ default: 60 }),

  BTC_RPC_HOST: Type.Optional(Type.String({ default: 'http://127.0.0.1' })),
  BTC_RPC_PORT: Type.Optional(Type.Integer({ default: 18443, minimum: 0, maximum: 65535 })),
  BTC_RPC_USER: Type.Optional(Type.String({ default: 'btc' })),
  BTC_RPC_PW: Type.Optional(Type.String({ default: 'btc' })),
  BTC_FAUCET_PK: Type.Optional(
    Type.String({ default: '29c028009a8331358adcc61bb6397377c995d327ac0343ed8e8f1d4d3ef85c27' })
  ),

  /** The contracts used to query for inbound transactions */
  TESTNET_SEND_MANY_CONTRACT_ID: Type.String({
    default: 'ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B.send-many-memo',
  }),
  MAINNET_SEND_MANY_CONTRACT_ID: Type.String({
    default: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.send-many-memo',
  }),

  /**
   * Directory containing Stacks 1.0 BNS data extracted from
   * https://storage.googleapis.com/blockstack-v1-migration-data/export-data.tar.gz
   */
  BNS_IMPORT_DIR: Type.Optional(Type.String()),

  /**
   * Stacks blockchain node type (L1 or subnet). L1 by default. If STACKS_NODE_TYPE is set to
   * subnet, BNS importer is skipped.
   */
  STACKS_NODE_TYPE: Type.String({ default: 'L1' }),

  /** Enable Rosetta endpoints. */
  STACKS_API_ENABLE_ROSETTA: Type.Boolean({ default: false }),
  /** Enable FT metadata processing for Rosetta operations display. Disabled by default. */
  STACKS_API_ENABLE_FT_METADATA: Type.Boolean({ default: false }),
  /**
   * The Rosetta API endpoints require FT metadata to display operations with the proper `symbol`
   * and `decimals` values. If FT metadata is enabled, this variable controls the token metadata
   * error handling mode when metadata is not found. The possible values are:
   * * `warning`: The API will issue a warning and not display data for that token.
   * * `error`: The API will throw an error. If not specified or any other value is provided, the
   *            mode will be set to `warning`.
   */
  STACKS_API_TOKEN_METADATA_ERROR_MODE: Type.Enum(
    { warning: 'warning', error: 'error' },
    { default: 'warning' }
  ),

  /** Web Socket ping interval to determine client availability, in seconds. */
  STACKS_API_WS_PING_INTERVAL: Type.Integer({ default: 5 }),
  /**
   * Web Socket ping timeout, in seconds. Clients will be dropped if they do not respond with a pong
   * after this time has elapsed.
   */
  STACKS_API_WS_PING_TIMEOUT: Type.Integer({ default: 5 }),
  /**
   * Web Socket message timeout, in seconds. Clients will be dropped if they do not acknowledge a
   * message after this time has elapsed.
   */
  STACKS_API_WS_MESSAGE_TIMEOUT: Type.Integer({ default: 5 }),
  /**
   * Web Socket update queue timeout, in seconds. When an update is scheduled (new block, tx update,
   * etc.), we will allow this number of seconds to elapse to allow all subscribed clients to
   * receive new data.
   */
  STACKS_API_WS_UPDATE_QUEUE_TIMEOUT: Type.Integer({ default: 5 }),

  /**
   * Specify max number of STX address to store in an in-memory LRU cache (CPU optimization).
   * Defaults to 50,000, which should result in around 25 megabytes of additional memory usage.
   */
  STACKS_ADDRESS_CACHE_SIZE: Type.Integer({ default: 10_000 }),

  /**
   * Specify a URL to redirect from /doc. If this URL is not provided, server renders local
   * documentation of openapi.yaml for test / development NODE_ENV. For production, /doc is not
   * served if this env var is not provided.
   */
  API_DOCS_URL: Type.String({ default: 'https://docs.hiro.so/api' }),

  /**
   * For use while syncing. Places the API into an "Initial Block Download(IBD)" mode, forcing it to
   * stop any redundant processing until the node is fully synced up to its peers. Some examples of
   * processing that are avoided are: REFRESH MATERIALIZED VIEW SQLs that are extremely CPU
   * intensive on the PG instance, Mempool messages, etc.,
   */
  IBD_MODE_UNTIL_BLOCK: Type.Optional(Type.Integer()),

  /** Folder with events to be imported by the event-replay. */
  STACKS_EVENTS_DIR: Type.String({ default: './events' }),
});
type Env = Static<typeof schema>;

export const ENV = envSchema<Env>({
  schema: schema,
  dotenv: true,
});
