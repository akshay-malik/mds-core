import { Enum } from '@mds-core/mds-types'

// TODO providers are in CSV

const TABLE = Enum(
  'audit_events',
  'audits',
  'devices',
  'events',
  'geographies',
  'geography_metadata',
  'migrations',
  'policies',
  'policy_metadata',
  'status_changes',
  'telemetry',
  'trips'
)
export type TABLE_NAME = keyof typeof TABLE
const TABLES = Object.keys(TABLE) as TABLE_NAME[]

const COLUMN = Enum(
  'accuracy',
  'actual_cost',
  'altitude',
  'associated_trip',
  'audit_device_id',
  'audit_event_id',
  'audit_event_type',
  'audit_issue_code',
  'audit_subject_id',
  'audit_trip_id',
  'battery_pct',
  'charge',
  'deleted',
  'device_id',
  'event_location',
  'event_time',
  'event_type_reason',
  'event_type',
  'first_trip_enter',
  'geography_id',
  'geography_json',
  'geography_metadata',
  'heading',
  'id',
  'last_trip_leave',
  'lat',
  'lng',
  'migration',
  'mfgr',
  'model',
  'name',
  'note',
  'parking_verification_url',
  'policy_id',
  'policy_json',
  'policy_metadata',
  'previous_geography_ids',
  'propulsion_type',
  'propulsion',
  'provider_device_id',
  'provider_event_id',
  'provider_event_type',
  'provider_event_type_reason',
  'provider_id',
  'provider_name',
  'provider_trip_id',
  'provider_vehicle_id',
  'read_only',
  'recorded',
  'route',
  'service_area_id',
  'speed',
  'standard_cost',
  'telemetry_timestamp',
  'timestamp',
  'trip_distance',
  'trip_duration',
  'trip_end',
  'trip_id',
  'trip_start',
  'type',
  'vehicle_id',
  'vehicle_type',
  'year'
)
export type COLUMN_NAME = keyof typeof COLUMN
const COLUMNS = Object.keys(COLUMN) as COLUMN_NAME[]

const TABLE_COLUMNS: { [T in TABLE_NAME]: Readonly<COLUMN_NAME[]> } = {
  [TABLE.audits]: [
    COLUMN.id,
    COLUMN.audit_trip_id,
    COLUMN.audit_device_id,
    COLUMN.audit_subject_id,
    COLUMN.provider_id,
    COLUMN.provider_name,
    COLUMN.provider_vehicle_id,
    COLUMN.provider_device_id,
    COLUMN.timestamp,
    COLUMN.deleted,
    COLUMN.recorded
  ],
  [TABLE.audit_events]: [
    COLUMN.id,
    COLUMN.audit_trip_id,
    COLUMN.audit_event_id,
    COLUMN.audit_event_type,
    COLUMN.audit_issue_code,
    COLUMN.audit_subject_id,
    COLUMN.provider_event_id,
    COLUMN.provider_event_type,
    COLUMN.provider_event_type_reason,
    COLUMN.note,
    COLUMN.timestamp,
    COLUMN.lat,
    COLUMN.lng,
    COLUMN.speed,
    COLUMN.heading,
    COLUMN.accuracy,
    COLUMN.altitude,
    COLUMN.charge,
    COLUMN.recorded
  ],
  [TABLE.devices]: [
    COLUMN.id,
    COLUMN.device_id,
    COLUMN.provider_id,
    COLUMN.vehicle_id,
    COLUMN.type,
    COLUMN.propulsion,
    COLUMN.year,
    COLUMN.mfgr,
    COLUMN.model,
    COLUMN.recorded
  ],
  [TABLE.events]: [
    COLUMN.id,
    COLUMN.device_id,
    COLUMN.provider_id,
    COLUMN.timestamp,
    COLUMN.event_type,
    COLUMN.event_type_reason,
    COLUMN.telemetry_timestamp,
    COLUMN.trip_id,
    COLUMN.service_area_id,
    COLUMN.recorded
  ],
  [TABLE.geographies]: [
    COLUMN.id,
    COLUMN.geography_id,
    COLUMN.geography_json,
    COLUMN.read_only,
    COLUMN.previous_geography_ids,
    COLUMN.name
  ],
  [TABLE.geography_metadata]: [COLUMN.id, COLUMN.geography_id, COLUMN.geography_metadata],
  [TABLE.migrations]: [COLUMN.id, COLUMN.migration, COLUMN.timestamp],
  [TABLE.policies]: [COLUMN.id, COLUMN.policy_id, COLUMN.policy_json],
  [TABLE.policy_metadata]: [COLUMN.id, COLUMN.policy_id, COLUMN.policy_metadata],
  [TABLE.status_changes]: [
    COLUMN.id,
    COLUMN.provider_id,
    COLUMN.provider_name,
    COLUMN.device_id,
    COLUMN.vehicle_id,
    COLUMN.vehicle_type,
    COLUMN.propulsion_type,
    COLUMN.event_type,
    COLUMN.event_type_reason,
    COLUMN.event_time,
    COLUMN.event_location,
    COLUMN.battery_pct,
    COLUMN.associated_trip,
    COLUMN.recorded
  ],
  [TABLE.telemetry]: [
    COLUMN.id,
    COLUMN.device_id,
    COLUMN.provider_id,
    COLUMN.timestamp,
    COLUMN.lat,
    COLUMN.lng,
    COLUMN.speed,
    COLUMN.heading,
    COLUMN.accuracy,
    COLUMN.altitude,
    COLUMN.charge,
    COLUMN.recorded
  ],
  [TABLE.trips]: [
    COLUMN.id,
    COLUMN.provider_id,
    COLUMN.provider_name,
    COLUMN.provider_trip_id,
    COLUMN.device_id,
    COLUMN.vehicle_id,
    COLUMN.vehicle_type,
    COLUMN.propulsion_type,
    COLUMN.trip_start,
    COLUMN.first_trip_enter,
    COLUMN.last_trip_leave,
    COLUMN.trip_end,
    COLUMN.trip_duration,
    COLUMN.trip_distance,
    COLUMN.route,
    COLUMN.accuracy,
    COLUMN.parking_verification_url,
    COLUMN.standard_cost,
    COLUMN.actual_cost,
    COLUMN.recorded
  ]
}

const TABLE_KEY: { [T in TABLE_NAME]: COLUMN_NAME[] } = {
  [TABLE.audits]: [COLUMN.audit_trip_id],
  [TABLE.audit_events]: [COLUMN.audit_trip_id, COLUMN.timestamp],
  [TABLE.devices]: [COLUMN.device_id],
  [TABLE.events]: [COLUMN.device_id, COLUMN.timestamp],
  [TABLE.geographies]: [COLUMN.geography_id],
  [TABLE.geography_metadata]: [COLUMN.geography_id],
  [TABLE.migrations]: [COLUMN.migration],
  [TABLE.policies]: [COLUMN.policy_id],
  [TABLE.policy_metadata]: [COLUMN.policy_id],
  [TABLE.status_changes]: [COLUMN.device_id, COLUMN.event_time],
  [TABLE.telemetry]: [COLUMN.device_id, COLUMN.timestamp],
  [TABLE.trips]: [COLUMN.provider_trip_id]
}

const COLUMN_TYPE: { [C in COLUMN_NAME]: string } = {
  [COLUMN.accuracy]: 'real',
  [COLUMN.actual_cost]: 'int',
  [COLUMN.altitude]: 'real',
  [COLUMN.associated_trip]: 'uuid',
  [COLUMN.audit_device_id]: 'uuid NOT NULL',
  [COLUMN.audit_event_id]: 'uuid NOT NULL',
  [COLUMN.audit_event_type]: 'varchar(31) NOT NULL',
  [COLUMN.audit_issue_code]: 'varchar(31)',
  [COLUMN.audit_subject_id]: 'varchar(255) NOT NULL',
  [COLUMN.audit_trip_id]: 'uuid NOT NULL',
  [COLUMN.battery_pct]: 'real',
  [COLUMN.charge]: 'real',
  [COLUMN.deleted]: 'bigint',
  [COLUMN.device_id]: 'uuid NOT NULL',
  [COLUMN.event_location]: 'jsonb',
  [COLUMN.event_time]: 'bigint NOT NULL',
  [COLUMN.event_type_reason]: 'varchar(31)',
  [COLUMN.event_type]: 'varchar(31) NOT NULL',
  [COLUMN.first_trip_enter]: 'bigint',
  [COLUMN.geography_id]: 'uuid NOT NULL',
  [COLUMN.geography_json]: 'json NOT NULL',
  [COLUMN.geography_metadata]: 'json',
  [COLUMN.heading]: 'real',
  [COLUMN.id]: 'bigint GENERATED ALWAYS AS IDENTITY',
  [COLUMN.last_trip_leave]: 'bigint',
  [COLUMN.lat]: 'double precision NOT NULL',
  [COLUMN.lng]: 'double precision NOT NULL',
  [COLUMN.migration]: 'varchar(255) NOT NULL',
  [COLUMN.mfgr]: 'varchar(127)',
  [COLUMN.model]: 'varchar(127)',
  [COLUMN.name]: 'varchar(255)',
  [COLUMN.note]: 'varchar(255)',
  [COLUMN.parking_verification_url]: 'varchar(255)',
  [COLUMN.policy_id]: 'uuid NOT NULL',
  [COLUMN.policy_json]: 'json NOT NULL',
  [COLUMN.policy_metadata]: 'json',
  [COLUMN.previous_geography_ids]: 'uuid[]',
  [COLUMN.propulsion_type]: 'varchar(31)[] NOT NULL',
  [COLUMN.propulsion]: 'varchar(31)[] NOT NULL',
  [COLUMN.provider_device_id]: 'uuid', // May be null if can't find
  [COLUMN.provider_event_id]: 'bigint',
  [COLUMN.provider_event_type]: 'varchar(31)',
  [COLUMN.provider_event_type_reason]: 'varchar(31)',
  [COLUMN.provider_id]: 'uuid NOT NULL',
  [COLUMN.provider_name]: 'varchar(127) NOT NULL',
  [COLUMN.provider_trip_id]: 'uuid NOT NULL',
  [COLUMN.provider_vehicle_id]: 'varchar(255) NOT NULL',
  [COLUMN.read_only]: 'bool DEFAULT FALSE',
  [COLUMN.recorded]: 'bigint NOT NULL', // timestamp of when record was created
  [COLUMN.route]: 'jsonb',
  [COLUMN.service_area_id]: 'uuid',
  [COLUMN.speed]: 'real',
  [COLUMN.standard_cost]: 'int',
  [COLUMN.telemetry_timestamp]: 'bigint',
  [COLUMN.timestamp]: 'bigint NOT NULL',
  [COLUMN.trip_distance]: 'int',
  [COLUMN.trip_duration]: 'int',
  [COLUMN.trip_end]: 'bigint',
  [COLUMN.trip_id]: 'uuid',
  [COLUMN.trip_start]: 'bigint',
  [COLUMN.type]: 'varchar(31) NOT NULL',
  [COLUMN.vehicle_id]: 'varchar(255) NOT NULL',
  [COLUMN.vehicle_type]: 'varchar(31) NOT NULL',
  [COLUMN.year]: 'smallint'
}

export default {
  COLUMN,
  COLUMNS,
  COLUMN_TYPE,
  TABLE,
  TABLES,
  TABLE_COLUMNS,
  TABLE_KEY
}
