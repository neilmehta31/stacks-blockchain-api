/** @param { import("node-pg-migrate").MigrationBuilder } pgm */
exports.up = pgm => {
  pgm.createTable('pox_sets', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    index_block_hash: {
      type: 'bytea',
      notNull: true,
    },
    cycle_number: {
      type: 'bigint',
      notNull: true,
    },
    canonical: {
      type: 'boolean',
      notNull: true,
    },
    signing_key: {
      type: 'bytea',
      notNull: true,
    },
    slots: {
      type: 'bigint',
      notNull: true,
    },
    stacked_amount: {
      type: 'numeric',
      notNull: true,
    },
  });

  pgm.createIndex('pox_sets', 'index_block_hash');
  pgm.createIndex('pox_sets', 'signing_key');
  pgm.createIndex('pox_sets', 'cycle_number');
}
