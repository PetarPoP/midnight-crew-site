import * as migration_20261017_110438_initial from './20261017_110438_initial';
import * as migration_20261017_111111_event_timezone from './20261017_111111_event_timezone';

export const migrations = [
  {
    up: migration_20261017_110438_initial.up,
    down: migration_20261017_110438_initial.down,
    name: '20261017_110438_initial',
  },
  {
    up: migration_20261017_111111_event_timezone.up,
    down: migration_20261017_111111_event_timezone.down,
    name: '20261017_111111_event_timezone'
  },
];
