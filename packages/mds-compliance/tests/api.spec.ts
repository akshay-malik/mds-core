/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable promise/no-callback-in-promise */
/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable promise/prefer-await-to-callbacks */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { PROVIDER_AUTH, makeDevices, makeEventsWithTelemetry, makeTelemetryInArea } from '@mds-core/mds-test-data'

import test from 'unit.js'
import { api as agency } from '@mds-core/mds-agency'
import { api as policy } from '@mds-core/mds-policy'
import { api as provider } from '@mds-core/mds-provider'
import cache from '@mds-core/mds-cache'
import db from '@mds-core/mds-db'
import supertest from 'supertest'
import { now } from '@mds-core/mds-utils'
import {
  Telemetry,
  Device,
  Policy,
  Geography,
  VehicleEvent,
  UUID,
  RULE_TYPES,
  VEHICLE_TYPES,
  PROPULSION_TYPES
} from '@mds-core/mds-types'
import MockDate from 'mockdate'
import { Feature, Polygon } from 'geojson'
import uuidv4 from 'uuid/v4'
import { ApiServer } from '@mds-core/mds-api-server'
import { TEST1_PROVIDER_ID } from '@mds-core/mds-providers'
import { la_city_boundary } from './la-city-boundary'
import { api } from '../api'

const request = supertest(ApiServer(api))
const agency_request = supertest(ApiServer(agency))
const policy_request = supertest(ApiServer(policy))
const provider_request = supertest(ApiServer(provider))

const TRIP_UUID = '1f981864-cc17-40cf-aea3-70fd985e2ea7'
const DEVICE_UUID = 'ec551174-f324-4251-bfed-28d9f3f473fc'
const CITY_OF_LA = '1f943d59-ccc9-4d91-b6e2-0c5e771cbc49'
const LA_BEACH = 'ff822e26-a70c-4721-ac32-2f6734beff9b'
const SAN_FERNANDO_DAC = 'e3ed0a0e-61d3-4887-8b6a-4af4f3769c14'

/* eslint-disable @typescript-eslint/no-var-requires */
const restrictedAreas = require('../../ladot-service-areas/restricted-areas')
const veniceSpecialOpsZone = require('../../ladot-service-areas/venice-special-ops-zone')
const sanFernandoDAC = require('../../ladot-service-areas/san-fernando-dac')
/* eslint-enable @typescript-eslint/no-var-requires */

let testTimestamp = now()

const TEST_TELEMETRY = {
  device_id: DEVICE_UUID,
  gps: {
    lat: 37.3382,
    lng: -121.8863,
    speed: 0,
    hdop: 1,
    heading: 180
  },
  charge: 0.5,
  timestamp: now()
}

process.env.TIMEZONE = 'America/Los_Angeles'
process.env.PATH_PREFIX = '/compliance'
const PROVIDER_SCOPES = 'admin:all test:all'
const ADMIN_AUTH = `basic ${Buffer.from(`${TEST1_PROVIDER_ID}|${PROVIDER_SCOPES}`).toString('base64')}`
const AUTH_ADMIN_ONLY_SCOPE = `basic ${Buffer.from(`${TEST1_PROVIDER_ID}|admin:all`).toString('base64')}`
const AUTH_TEST_ONLY_SCOPE = `basic ${Buffer.from(`${TEST1_PROVIDER_ID}|test:all`).toString('base64')}`
const TEST_VEHICLE = {
  device_id: DEVICE_UUID,
  provider_id: TEST1_PROVIDER_ID,
  vehicle_id: 'test-id-1',
  type: VEHICLE_TYPES.bicycle,
  propulsion: [PROPULSION_TYPES.human],
  year: 2018,
  mfgr: 'Schwinn',
  model: 'Mantaray'
}
// const start_yesterday = now() - (now() % days(1))
const VENICE_POLICY_UUID = 'dd9ace3e-14c8-461b-b5e7-1326505ff176'

const COUNT_POLICY_UUID = '72971a3d-876c-41ea-8e48-c9bb965bbbcc'
const COUNT_POLICY_UUID_2 = '37637f96-2580-475a-89e7-cfc5d2e70f84'
const COUNT_POLICY_UUID_3 = 'e8f9a720-6c12-41c8-a31c-715e76d65ea1'
const COUNT_POLICY_UUID_4 = 'b3b8529e-46e0-4d44-877b-2fb4e0ba3515'
const COUNT_POLICY_UUID_5 = '5b2b2b43-3f7e-4a90-b273-deb296c8fd93'
const COUNT_POLICY_JSON: Policy = {
  name: 'LADOT Mobility Caps',
  description: 'Mobility caps as described in the One-Year Permit',
  policy_id: COUNT_POLICY_UUID,
  start_date: 1558389669540,
  end_date: null,
  prev_policies: null,
  provider_ids: [],
  rules: [
    {
      name: 'Greater LA',
      rule_id: '47c8c7d4-14b5-43a3-b9a5-a32ecc2fb2c6',
      rule_type: RULE_TYPES.count,
      geographies: [CITY_OF_LA],
      statuses: { available: [], unavailable: [], reserved: [], trip: [] },
      vehicle_types: [VEHICLE_TYPES.bicycle, VEHICLE_TYPES.scooter],
      maximum: 10,
      minimum: 5
    }
  ]
}

const COUNT_POLICY_JSON_2: Policy = {
  name: 'Something Mobility Caps',
  description: 'Mobility caps as described in the One-Year Permit',
  policy_id: COUNT_POLICY_UUID_2,
  start_date: 1558389669540,
  end_date: null,
  prev_policies: null,
  provider_ids: [],
  rules: [
    {
      name: 'No vehicles permitted on Venice Beach on weekends',
      rule_id: '405b959e-4377-4a31-8b34-a9a4771125fc',
      rule_type: RULE_TYPES.count,
      geographies: ['ff822e26-a70c-4721-ac32-2f6734beff9b'],
      statuses: { available: [], unavailable: [], reserved: [], trip: [] },
      days: ['sat', 'sun'],
      maximum: 0,
      minimum: 0
    }
  ]
}

const COUNT_POLICY_JSON_3: Policy = {
  name: 'LADOT Mobility Caps',
  description: 'Mobility caps as described in the One-Year Permit',
  policy_id: COUNT_POLICY_UUID_3,
  start_date: 1558389669540,
  end_date: null,
  prev_policies: null,
  provider_ids: [],
  rules: [
    {
      name: 'Greater LA',
      rule_id: '04dc545b-41d8-401d-89bd-bfac9247b555',
      rule_type: RULE_TYPES.count,
      geographies: [CITY_OF_LA],
      statuses: { available: ['service_start'], unavailable: [], reserved: [], trip: [] },
      vehicle_types: [VEHICLE_TYPES.bicycle, VEHICLE_TYPES.scooter],
      maximum: 10
    }
  ]
}

const COUNT_POLICY_JSON_4: Policy = {
  name: 'LADOT Mobility Caps',
  description: 'Mobility caps as described in the One-Year Permit',
  policy_id: COUNT_POLICY_UUID_4,
  start_date: 1558389669540,
  end_date: null,
  prev_policies: null,
  provider_ids: [],
  rules: [
    {
      name: 'Greater LA',
      rule_id: '04dc545b-41d8-401d-89bd-bfac9247b555',
      rule_type: RULE_TYPES.count,
      geographies: [CITY_OF_LA],
      statuses: { trip: [] },
      vehicle_types: ['bicycle', 'scooter'],
      maximum: 10
    }
  ]
}

// /*
const COUNT_POLICY_JSON_5: Policy = {
  name: 'exercise rules with stacking violations',
  description: 'see the name',
  policy_id: COUNT_POLICY_UUID_5,
  start_date: 1558389669540,
  end_date: null,
  prev_policies: null,
  provider_ids: [],
  rules: [
    {
      name: 'San Fernando DAC',
      rule_id: '2622242d-7658-43d3-b1c7-3abe46fcabd1',
      rule_type: RULE_TYPES.count,
      geographies: [CITY_OF_LA],
      statuses: { available: [], unavailable: [], reserved: [], trip: [] },
      vehicle_types: [VEHICLE_TYPES.bicycle, VEHICLE_TYPES.scooter],
      maximum: 10,
      minimum: 1
    }
    /* ,
    {
      name: 'Venice Beach',
      rule_id: '5117e94a-08c8-4538-b97d-a2e24b150448',
      rule_type: RULE_TYPES.count,
      geographies: [LA_BEACH],
      statuses: { trip: [] },
      vehicle_types: ['bicycle', 'scooter'],
      minimum: 10
    }
    */
  ]
}
//* /

const TIME_POLICY_UUID = 'a2c9a65f-fd85-463e-9564-fc95ea473f7d'

const TIME_POLICY_JSON: Policy = {
  name: 'Maximum Idle Time',
  description: 'LADOT Pilot Idle Time Limitations',
  policy_id: TIME_POLICY_UUID,
  start_date: 1558389669540,
  end_date: null,
  prev_policies: null,
  provider_ids: [],
  rules: [
    {
      name: 'Greater LA (rentable)',
      rule_id: '1ec4fe12-10f8-4bb9-808e-3222d5a5425f',
      rule_type: RULE_TYPES.time,
      rule_units: 'minutes',
      geographies: [CITY_OF_LA],
      statuses: { available: [] },
      vehicle_types: [VEHICLE_TYPES.bicycle, VEHICLE_TYPES.scooter],
      maximum: 7200
    }
  ]
}

const APP_JSON = 'application/json; charset=utf-8'
describe('Tests Compliance API:', () => {
  afterEach(done => {
    agency_request
      .get('/test/shutdown')
      .set('Authorization', ADMIN_AUTH)
      .expect(200)
      .end(err => {
        done(err)
      })
  })

  describe('Misc DB Tests: ', () => {
    it('verifies unable to access test if not scoped', done => {
      request
        .get('/test/')
        .set('Authorization', AUTH_ADMIN_ONLY_SCOPE)
        .expect(403)
        .end((err, result) => {
          test.value(result).hasHeader('content-type', APP_JSON)
          test.string(result.body.result).contains('no test access without test:all scope')
          done(err)
        })
    })

    it('verifies unable to access admin if not scoped', done => {
      request
        .get('/admin/')
        .set('Authorization', AUTH_TEST_ONLY_SCOPE)
        .expect(403)
        .end((err, result) => {
          test.value(result).hasHeader('content-type', APP_JSON)
          test.string(result.body.result).contains('no admin access without admin:all scope')
          done(err)
        })
    })
  })

  describe('Singular Policy API Sanity Checks: ', () => {
    beforeEach(done => {
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          agency_request
            .post('/vehicles')
            .set('Authorization', ADMIN_AUTH)
            .send(TEST_VEHICLE)
            .expect(201)
            .end(() => {
              agency_request
                .post(`/vehicles/${DEVICE_UUID}/event`)
                .set('Authorization', ADMIN_AUTH)
                .send({
                  event_type: 'trip_start',
                  trip_id: TRIP_UUID,
                  telemetry: TEST_TELEMETRY,
                  timestamp: testTimestamp++
                })
                .expect(201)
                .end(() => {
                  const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
                  policy_request
                    .post(`/admin/geographies/${CITY_OF_LA}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(geography)
                    .expect(200)
                    .end(() => {
                      policy_request
                        .post(`/admin/policies/${COUNT_POLICY_UUID}`)
                        .set('Authorization', ADMIN_AUTH)
                        .send(COUNT_POLICY_JSON)
                        .expect(200)
                        .end(() => {
                          done()
                        })
                    })
                })
            })
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })

    it('Verifies initial policy hit OK', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          console.log('initial policy hit')
          console.log(result.body)
          test.assert(result.body.length === 1)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    it('Verifies cannot query invalid policy_id', done => {
      request
        .get(`/snapshot/potato`)
        .set('Authorization', ADMIN_AUTH)
        .expect(400)
        .end((err, result) => {
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    it('Verifies cannot query valid UUID, but invalid policy_id', done => {
      request
        .get(`/snapshot/f4a07b35-98dd-4234-93c7-199ea54083c3`)
        .set('Authorization', ADMIN_AUTH)
        .expect(400)
        .end((err, result) => {
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })
  })

  describe('Count Compliant Test: ', () => {
    before(done => {
      const devices: Device[] = makeDevices(7, now())
      const events = makeEventsWithTelemetry(devices, now() - 100000, CITY_OF_LA, 'trip_end')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${CITY_OF_LA}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${COUNT_POLICY_UUID}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(COUNT_POLICY_JSON)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies count in compliance', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].total_violations === 0)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Count Violation Under Test: ', () => {
    before(done => {
      const devices: Device[] = makeDevices(2, now())
      const events = makeEventsWithTelemetry(devices, now() - 100000, CITY_OF_LA, 'trip_end')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${CITY_OF_LA}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${COUNT_POLICY_UUID}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(COUNT_POLICY_JSON)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies violation of count compliance (under)', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance[0].matches[0].measured === 2)
          test.assert(result.body[0].total_violations === 3)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Count Violation Over Test: ', () => {
    before(done => {
      const devices: Device[] = makeDevices(15, now())
      const events = makeEventsWithTelemetry(devices, now() - 100000, CITY_OF_LA, 'trip_end')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${CITY_OF_LA}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${COUNT_POLICY_UUID}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(COUNT_POLICY_JSON)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies violation of count compliance (over)', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          console.log(result.body)
          console.log(result.body[0].compliance[0])
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance[0].matches[0].measured === 10)
          test.assert(result.body[0].total_violations === 5)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Time Compliant Test: ', () => {
    before(done => {
      const devices: Device[] = makeDevices(15, now())
      const events = makeEventsWithTelemetry(devices, now() - 10, CITY_OF_LA, 'trip_end')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${CITY_OF_LA}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${TIME_POLICY_UUID}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(TIME_POLICY_JSON)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies OK time compliance', done => {
      request
        .get(`/snapshot/${TIME_POLICY_UUID}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance[0].matches.length === 0)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Time Violation Test: ', () => {
    before(done => {
      const devices: Device[] = makeDevices(15, now())
      const events = makeEventsWithTelemetry(devices, now() - 1000000, CITY_OF_LA, 'trip_end')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${CITY_OF_LA}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${TIME_POLICY_UUID}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(TIME_POLICY_JSON)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies violation of time compliance', done => {
      request
        .get(`/snapshot/${TIME_POLICY_UUID}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance[0].matches.length === 15)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Attempts to check compliance for non-existent policy', () => {
    it('Checks for a valid UUID, but not present in db', done => {
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          request
            .get(`/snapshot/${TIME_POLICY_UUID}`)
            .set('Authorization', ADMIN_AUTH)
            .expect(400)
            .end(err => {
              done(err)
            })
        })
    })
  })

  describe('Verifies day-based bans work properly', () => {
    before(done => {
      const devices: Device[] = makeDevices(15, now())
      const events = makeEventsWithTelemetry(devices, now() - 10, LA_BEACH, 'trip_end')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), LA_BEACH, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: LA_BEACH, geography_json: restrictedAreas }
              policy_request
                .post(`/admin/geographies/${LA_BEACH}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${COUNT_POLICY_UUID_2}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(COUNT_POLICY_JSON_2)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies on a tuesday that vehicles are allowed', done => {
      MockDate.set('2019-05-21T20:00:00.000Z')
      request
        .get(`/snapshot/${COUNT_POLICY_UUID_2}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance.length === 1)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    it('Verifies on a saturday that vehicles are not allowed', done => {
      MockDate.set('2019-05-25T20:00:00.000Z')
      request
        .get(`/snapshot/${COUNT_POLICY_UUID_2}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance[0].matches[0].measured === 15)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })
  })

  describe('Particular Event Violation: ', () => {
    before(done => {
      const devices: Device[] = makeDevices(15, now())
      const events = makeEventsWithTelemetry(devices, now() - 100000, CITY_OF_LA, 'service_start')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${CITY_OF_LA}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${COUNT_POLICY_UUID_3}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(COUNT_POLICY_JSON_3)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies violation for particular event', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID_3}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance[0].matches[0].measured === 10)
          test.assert(result.body[0].total_violations === 5)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Particular Event Compliance: ', () => {
    before(done => {
      const devices: Device[] = makeDevices(15, now())
      const events = makeEventsWithTelemetry(devices, now() - 100000, CITY_OF_LA, 'trip_end')
      const telemetry: Telemetry[] = []
      devices.forEach(device => {
        telemetry.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({ devices, events, telemetry })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${CITY_OF_LA}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  policy_request
                    .post(`/admin/policies/${COUNT_POLICY_UUID_3}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(COUNT_POLICY_JSON_3)
                    .expect(200)
                    .end(() => {
                      done(err)
                    })
                })
            })
        })
    })

    it('Verifies compliance for particular event', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID_3}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].total_violations === 0)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Verifies venice beach spec ops', () => {
    before(done => {
      const veniceSpecOpsPointIds: UUID[] = []
      const geographies: Geography[] = veniceSpecialOpsZone.features.map((feature: Feature) => {
        if (feature.geometry.type === 'Point') {
          const uuid = uuidv4()
          veniceSpecOpsPointIds.push(uuid)
          return {
            geography_id: uuid,
            geography_json: feature
          }
        }
        return {
          geography_id: 'e0e4a085-7a50-43e0-afa4-6792ca897c5a',
          geography_json: feature
        }
      })

      const VENICE_SPEC_OPS_POLICY: Policy = {
        name: 'Venice Special Operations Zone',
        description: 'LADOT Venice Drop-off/no-fly zones',
        policy_id: VENICE_POLICY_UUID,
        start_date: 1558389669540,
        end_date: null,
        prev_policies: null,
        provider_ids: [],
        rules: [
          {
            name: 'Valid Provider Drop Offs',
            rule_id: '7a043ac8-03cd-4b0d-9588-d0af24f82832',
            rule_type: RULE_TYPES.count,
            geographies: veniceSpecOpsPointIds,
            statuses: { available: ['provider_drop_off'] },
            vehicle_types: [VEHICLE_TYPES.bicycle, VEHICLE_TYPES.scooter]
          },
          {
            name: 'Drop-off No-Fly Zones',
            rule_id: '596d7fe1-53fd-4ea4-8ba7-33f5ea8d98a6',
            rule_type: RULE_TYPES.count,
            geographies: ['e0e4a085-7a50-43e0-afa4-6792ca897c5a'],
            statuses: { available: ['provider_drop_off'] },
            vehicle_types: [VEHICLE_TYPES.bicycle, VEHICLE_TYPES.scooter],
            maximum: 0
          }
        ]
      }

      const TEST_ZONE_NO_VALID_DROP_OFF_POINTS: Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [-118.46941709518433, 33.9807517760146],
            [-118.46564054489136, 33.9807517760146],
            [-118.46564054489136, 33.98356306245639],
            [-118.46941709518433, 33.98356306245639],
            [-118.46941709518433, 33.9807517760146]
          ]
        ]
      }

      const devices_a: Device[] = makeDevices(22, now())
      let iter = 0
      const events_a: VehicleEvent[] = veniceSpecialOpsZone.features.reduce((acc: VehicleEvent[], feature: Feature) => {
        if (feature.geometry.type === 'Point') {
          acc.push(...makeEventsWithTelemetry([devices_a[iter++]], now() - 10, feature.geometry, 'provider_drop_off'))
        }
        return acc
      }, [])

      const devices_b: Device[] = makeDevices(10, now())
      const events_b: VehicleEvent[] = makeEventsWithTelemetry(
        devices_b,
        now() - 10,
        TEST_ZONE_NO_VALID_DROP_OFF_POINTS,
        'provider_drop_off'
      )
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          // Seed
          const seedData: { devices: Device[]; events: VehicleEvent[]; telemetry: Telemetry[] } = {
            devices: [...devices_a, ...devices_b],
            events: [...events_a, ...events_b],
            telemetry: []
          }
          Promise.all([db.initialize(), cache.initialize()]).then(() => {
            Promise.all([cache.seed(seedData), db.seed(seedData)]).then(() => {
              Promise.all(geographies.map((geography: Geography) => db.writeGeography(geography))).then(() => {
                db.writePolicy(VENICE_SPEC_OPS_POLICY).then(() => {
                  done()
                })
              })
            })
          })
        })
    })

    it('Verify 22 vehicles are matched within the first rule (inside of allowed zones), and 10 in the second (because they have not been previously matched).', done => {
      request
        .get(`/snapshot/${VENICE_POLICY_UUID}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body[0].compliance[0].matches.length === 22)
          test.assert(result.body[0].compliance[1].matches.length === 1)
          test.assert(result.body[0].compliance[1].matches[0].measured === 10)
          done(err)
        })
    })
  })

  describe('Tests reading historical compliance', () => {
    const yesterday = now() - 86400000
    before(done => {
      // Generate old events
      const devices: Device[] = makeDevices(15, yesterday)
      const events_a = makeEventsWithTelemetry(devices, yesterday, CITY_OF_LA, 'trip_start')
      const telemetry_a: Telemetry[] = []
      devices.forEach(device => {
        telemetry_a.push(makeTelemetryInArea(device, yesterday, CITY_OF_LA, 10))
      })

      // Generate new events
      const events_b = makeEventsWithTelemetry(devices, now(), CITY_OF_LA, 'provider_drop_off')
      const telemetry_b: Telemetry[] = []
      devices.forEach(device => {
        telemetry_a.push(makeTelemetryInArea(device, now(), CITY_OF_LA, 10))
      })

      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          // Seed
          const seedData = {
            devices: [...devices],
            events: [...events_a, ...events_b],
            telemetry: [...telemetry_a, ...telemetry_b]
          }
          Promise.all([db.initialize(), cache.initialize()]).then(() => {
            Promise.all([cache.seed(seedData), db.seed(seedData)]).then(() => {
              db.writeGeography({ geography_id: CITY_OF_LA, geography_json: la_city_boundary }).then(() => {
                db.writePolicy(COUNT_POLICY_JSON_4).then(() => {
                  done()
                })
              })
            })
          })
        })
    })

    it('Historical check reports 5 violations', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID_4}?end_date=${yesterday + 200}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].total_violations === 5)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    it('Current check reports 0 violations', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID_4}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.length === 1)
          test.assert(result.body[0].total_violations === 0)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })
  })

  describe('Tests count endpoint', () => {
    before(done => {
      const devices_a: Device[] = makeDevices(15, now())
      const events_a = makeEventsWithTelemetry(devices_a, now(), CITY_OF_LA, 'trip_start')
      const telemetry_a: Telemetry[] = devices_a.reduce((acc: Telemetry[], device) => {
        return [...acc, makeTelemetryInArea(device, now(), CITY_OF_LA, 10)]
      }, [])

      const devices_b: Device[] = makeDevices(15, now())
      const events_b = makeEventsWithTelemetry(devices_b, now(), CITY_OF_LA, 'provider_drop_off')
      const telemetry_b: Telemetry[] = devices_b.reduce((acc: Telemetry[], device) => {
        return [...acc, makeTelemetryInArea(device, now(), CITY_OF_LA, 10)]
      }, [])

      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          // Seed
          const seedData = {
            devices: [...devices_a, ...devices_b],
            events: [...events_a, ...events_b],
            telemetry: [...telemetry_a, ...telemetry_b]
          }
          Promise.all([db.initialize(), cache.initialize()]).then(() => {
            Promise.all([cache.seed(seedData), db.seed(seedData)]).then(() => {
              db.writePolicy(COUNT_POLICY_JSON).then(() => {
                db.writeGeography({ geography_id: CITY_OF_LA, geography_json: la_city_boundary }).then(() => {
                  done()
                })
              })
            })
          })
        })
    })

    it('Test count endpoint success', done => {
      request
        .get(`/count/47c8c7d4-14b5-43a3-b9a5-a32ecc2fb2c6`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          test.assert(result.body.count === 30)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    it('Test count endpoint failure with bad rule_id', done => {
      request
        .get(`/count/33ca0ee8-e74b-419d-88d3-aaaf05ac0509`)
        .set('Authorization', ADMIN_AUTH)
        .expect(404)
        .end(err => {
          done(err)
        })
    })
  })

  describe('Test stacking violations: ', () => {
    before(done => {
      const sanFernandoDevices: Device[] = makeDevices(15, now())
      //      const LABeachDevices: Device[] = makeDevices(4, now())
      console.log('made telemetry')
      const sanFernandoEvents: (VehicleEvent & { telemetry: Telemetry })[] = makeEventsWithTelemetry(
        sanFernandoDevices,
        now(),
        CITY_OF_LA,
        'trip_end'
      ) as (VehicleEvent & { telemetry: Telemetry })[]
      console.log('done with telemetry')
      //     const LABeachEvents = makeEventsWithTelemetry(LABeachDevices, now() - 100000, LA_BEACH, 'trip_end')
      const sanFernandoTelemetry: Telemetry[] = []
      //    const LABeachTelemetry: Telemetry[] = []
      sanFernandoEvents.forEach(event => {
        //        sanFernandoTelemetry.push(makeTelemetryInArea(device, now(), SAN_FERNANDO_DAC, 10))
        console.log('this is the telemetry what got made', event.telemetry)
        sanFernandoTelemetry.push(event.telemetry)
      })
      /*
      LABeachDevices.forEach(device => {
        LABeachTelemetry.push(makeTelemetryInArea(device, now(), LA_BEACH, 10))
      })
      */
      request
        .get('/test/initialize')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(() => {
          provider_request
            .post('/test/seed')
            .set('Authorization', PROVIDER_AUTH)
            .send({
              devices: sanFernandoDevices, // .concat(LABeachDevices),
              events: sanFernandoEvents, // LABeachEvents.concat(sanFernandoEvents),
              telemetry: sanFernandoTelemetry // .concat(LABeachTelemetry)
            })
            .expect(201)
            .end((err, result) => {
              test.value(result).hasHeader('content-type', APP_JSON)
              const geography = { geography_id: CITY_OF_LA, geography_json: la_city_boundary }
              policy_request
                .post(`/admin/geographies/${SAN_FERNANDO_DAC}`)
                .set('Authorization', ADMIN_AUTH)
                .send(geography)
                .expect(200)
                .end(() => {
                  const geography2 = { geography_id: LA_BEACH, geography_json: veniceSpecialOpsZone }
                  policy_request
                    .post(`/admin/geographies/${LA_BEACH}`)
                    .set('Authorization', ADMIN_AUTH)
                    .send(geography2)
                    .expect(200)
                    .end(() => {
                      policy_request
                        .post(`/admin/policies/${COUNT_POLICY_UUID_5}`)
                        .set('Authorization', ADMIN_AUTH)
                        .send(COUNT_POLICY_JSON_5)
                        .expect(200)
                        .end(() => {
                          done(err)
                        })
                    })
                })
            })
        })
    })

    it('Verifies violations stack properly', done => {
      request
        .get(`/snapshot/${COUNT_POLICY_UUID_5}`)
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end((err, result) => {
          console.log('result.body', result.body)
          console.log(result.body[0].compliance[0])
          console.log(result.body[0].compliance[1])
          // only one policy
          test.assert(result.body.length === 1)
          test.assert(result.body[0].compliance[0].matches[0].measured === 10)
          test.assert(result.body[0].total_violations === 5)
          test.value(result).hasHeader('content-type', APP_JSON)
          done(err)
        })
    })

    afterEach(done => {
      agency_request
        .get('/test/shutdown')
        .set('Authorization', ADMIN_AUTH)
        .expect(200)
        .end(err => {
          done(err)
        })
    })
  })
})
