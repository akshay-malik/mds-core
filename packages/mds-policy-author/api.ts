/*
    Copyright 2019 City of Los Angeles.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
 */

import express from 'express'
import Joi from '@hapi/joi'
import { VEHICLE_TYPES, DAYS_OF_WEEK } from '@mds-core/mds-types'
import db from '@mds-core/mds-db'
import { pathsFor, ServerError, UUID_REGEX } from '@mds-core/mds-utils'
import log from '@mds-core/mds-logger'
import { PolicyApiRequest, PolicyApiResponse } from './types'

const ruleSchema = Joi.object().keys({
  name: Joi.string().required(),
  rule_id: Joi.string()
    .guid()
    .required(),
  rule_type: Joi.string()
    .valid(['count', 'time', 'speed', 'user'])
    .required(),
  rule_units: Joi.string().valid(['seconds', 'minutes', 'hours', 'mph', 'kph']),
  geographies: Joi.array().items(Joi.string().guid()),
  statuses: Joi.object().keys({
    available: Joi.array(),
    reserved: Joi.array(),
    unavailable: Joi.array(),
    removed: Joi.array(),
    inactive: Joi.array(),
    trip: Joi.array(),
    elsewhere: Joi.array()
  }),
  vehicle_types: Joi.array().items(Joi.string().valid(Object.values(VEHICLE_TYPES))),
  maximum: Joi.number(),
  minimum: Joi.number(),
  start_time: Joi.string(),
  end_time: Joi.string(),
  days: Joi.array().items(Joi.string().valid(Object.values(DAYS_OF_WEEK))),
  messages: Joi.object(),
  value_url: Joi.string().uri()
})

const policySchema = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().required(),
  policy_id: Joi.string()
    .guid()
    .required(),
  start_date: Joi.date()
    .timestamp('javascript')
    .required(),
  end_date: Joi.date()
    .timestamp('javascript')
    .allow(null),
  prev_policies: Joi.array()
    .items(Joi.string().guid())
    .allow(null),
  provider_ids: Joi.array()
    .items(Joi.string().guid())
    .allow(null),
  rules: Joi.array()
    .min(1)
    .items(ruleSchema)
    .required()
})

const featureSchema = Joi.object()
  .keys({
    type: Joi.string()
      .valid(['Feature'])
      .required(),
    properties: Joi.object().required(),
    geometry: Joi.object().required()
  })
  .unknown(true) // TODO

const featureCollectionSchema = Joi.object()
  .keys({
    type: Joi.string()
      .valid(['FeatureCollection'])
      .required(),
    features: Joi.array()
      .min(1)
      .items(featureSchema)
      .required()
  })
  .unknown(true) // TODO

function api(app: express.Express): express.Express {
  /**
   * Policy-specific middleware to extract provider_id into locals, do some logging, etc.
   */
  app.use(async (req: PolicyApiRequest, res: PolicyApiResponse, next: express.NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*')
    try {
      // TODO verify presence of agency_id
      if (!(req.path.includes('/health') || req.path === '/' || req.path === '/schema/policy')) {
        if (res.locals.claims) {
          const { scope } = res.locals.claims

          // no test access without auth
          if (req.path.includes('/test/')) {
            if (!scope || !scope.includes('test:all')) {
              return res.status(403).send({ result: `no test access without test:all scope (${scope})` })
            }
          }

          // no admin access without auth
          if (req.path.includes('/admin/')) {
            if (!scope || !scope.includes('admin:all')) {
              /* istanbul ignore next */
              return res.status(403).send({ result: `no admin access without admin:all scope (${scope})` })
            }
          }

          // TODO alter authorization code to look for an agency_id
        } else {
          return res.status(401).send('Unauthorized')
        }
      }
    } catch (err) {
      /* istanbul ignore next */
      await log.error(req.originalUrl, 'request validation fail:', err.stack)
    }
    next()
  })

  // HOUSEKEEPING
  app.get(pathsFor('/test/initialize'), async (req, res) => {
    try {
      const kind = await Promise.all([db.initialize()])
      return res.send({
        result: `Policy initialized (${kind})`
      })
    } catch (err /* istanbul ignore next */) {
      await log.error('initialize failed', err)
      return res.status(500).send(new ServerError())
    }
  })

  app.get(pathsFor('/test/shutdown'), async (req, res) => {
    await Promise.all([db.shutdown()])
    log.info('shutdown complete (in theory)')
    return res.send({ result: 'cache/stream/db shutdown done' })
  })

  app.post(pathsFor('/admin/policies/:policy_id'), async (req, res) => {
    const policy = req.body
    const validation = Joi.validate(policy, policySchema)
    const details = validation.error ? validation.error.details : null

    if (details) {
      await log.error('invalid policy json', details)
      return res.status(400).send(details)
    }

    try {
      await db.writePolicy(policy)
      return res.status(200).send({ result: `successfully wrote policy of id ${policy.policy_id}` })
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).send({ result: `policy ${policy.policy_id} already exists! Did you mean to PUT?` })
      }
      /* istanbul ignore next */
      await log.error('failed to write policy', err)
      /* istanbul ignore next */
      return res.status(500).send({ error: new ServerError(err) })
    }
  })

  app.post(pathsFor('/admin/policies/:policy_id/publish'), async (req, res) => {
    const { policy_id } = req.params
    try {
      await db.publishPolicy(policy_id)
      return res.status(200).send({ result: `successfully wrote policy of id ${policy_id}` })
    } catch (err) {
      if (err.message.includes('geography') && err.message.includes('not_found')) {
        const geography_id = err.message.match(UUID_REGEX)
        return res.status(404).send({ error: `geography_id ${geography_id} not_found` })
      }
      if (err.message.includes('policy') && err.message.includes('not_found')) {
        return res.status(404).send({ error: `policy_id ${policy_id} not_found` })
      }
      if (err.message.includes('Cannot re-publish existing policy')) {
        return res.status(409).send({ error: `policy_id ${policy_id} has already been published` })
      }
      /* istanbul ignore next */
      await log.error('failed to publish policy', err.stack)
      /* istanbul ignore next */
      return res.status(404).send({ result: 'not found' })
    }
  })

  app.put(pathsFor('/admin/policies/:policy_id'), async (req, res) => {
    const policy = req.body
    const validation = Joi.validate(policy, policySchema)
    const details = validation.error ? validation.error.details : null

    if (details) {
      return res.status(400).send(details)
    }

    try {
      await db.editPolicy(policy)
      return res.status(200).send({ result: `successfully edited policy ${policy}` })
    } catch (err) {
      if (err.message.includes('not_found')) {
        return res.status(404).send({ error: 'not_found' })
      }
      if (err.message.includes('Cannot edit published policy')) {
        return res.status(409).send({ error: `policy ${policy.policy_id} has already been published!` })
      }
      /* istanbul ignore next */
      await log.error('failed to edit policy', err.stack)
      /* istanbul ignore next */
      return res.status(500).send({ error: new ServerError(err) })
    }
  })

  app.delete(pathsFor('/admin/policies/:policy_id'), async (req, res) => {
    const { policy_id } = req.params
    try {
      await db.deletePolicy(policy_id)
      return res.status(200).send({ result: `successfully deleted policy of id ${policy_id}` })
    } catch (err) {
      /* istanbul ignore next */
      await log.error('failed to delete policy', err.stack)
      /* istanbul ignore next */
      return res.status(404).send({ result: 'policy either not found, or has already been published' })
    }
  })

  app.get(pathsFor('/admin/policies/meta/:policy_id'), async (req, res) => {
    const { policy_id } = req.params
    try {
      const { policy_metadata } = await db.readPolicyMetadata(policy_id)
      return res.status(200).send(policy_metadata)
    } catch (err) {
      await log.error('failed to read geography metadata', err.stack)
      return res.status(404).send({ result: 'not found' })
    }
  })

  app.post(pathsFor('/admin/policies/meta/:policy_id'), async (req, res) => {
    const policy_metadata = req.body
    const { policy_id } = req.params
    try {
      await db.writePolicyMetadata(policy_id, policy_metadata)
      return res.status(200).send({ result: `successfully wrote policy metadata of id ${policy_id}` })
    } catch (err) {
      await log.error('failed to write geography metadata', err.stack)
      return res.status(404).send({ result: 'not found' })
    }
  })

  app.post(pathsFor('/admin/geographies/:geography_id'), async (req, res) => {
    const geography = req.body
    const validation = Joi.validate(geography.geography_json, featureCollectionSchema)
    const details = validation.error ? validation.error.details : null
    if (details) {
      return res.status(400).send(details)
    }

    try {
      await db.writeGeography(geography)
      return res.status(200).send({ result: `Successfully wrote geography of id ${geography.geography_id}` })
    } catch (err) {
      if (err.code === '23505') {
        return res
          .status(409)
          .send({ result: `geography ${geography.geography_id} already exists! Did you mean to PUT?` })
      }
      /* istanbul ignore next */
      await log.error('failed to write geography', err.stack)
      /* istanbul ignore next */
      return res.status(500).send(new ServerError(err))
    }
  })

  app.put(pathsFor('/admin/geographies/:geography_id'), async (req, res) => {
    const geography = req.body
    const validation = Joi.validate(geography.geography_json, featureCollectionSchema)
    const details = validation.error ? validation.error.details : null
    if (details) {
      return res.status(400).send(details)
    }

    try {
      await db.editGeography(geography)
      return res.status(200).send({ result: `Successfully wrote geography of id ${geography.geography_id}` })
    } catch (err) {
      await log.error('failed to write geography', err.stack)
      return res.status(404).send({ result: 'not found' })
    }
  })

  app.delete(pathsFor('/admin/geographies/:geography_id'), async (req, res) => {
    const { geography_id } = req.params
    try {
      await db.deleteGeography(geography_id)
      return res.status(200).send({ result: `Successfully deleted geography of id ${geography_id}` })
    } catch (err) {
      await log.error('failed to delete geography', err.stack)
      return res.status(404).send({ result: 'geography either not found or already published' })
    }
  })

  app.get(pathsFor('/admin/geographies/meta/:geography_id'), async (req, res) => {
    const { geography_id } = req.params
    try {
      const { geography_metadata } = await db.readGeographyMetadata(geography_id)
      return res.status(200).send(geography_metadata)
    } catch (err) {
      await log.error('failed to read geography metadata', err.stack)
      return res.status(404).send({ result: 'not found' })
    }
  })

  app.post(pathsFor('/admin/geographies/meta/:geography_id'), async (req, res) => {
    const geography_metadata = req.body
    const { geography_id } = req.params
    try {
      await db.writeGeographyMetadata(geography_id, geography_metadata)
      return res.status(200).send({ result: `successfully wrote geography metadata of id ${geography_id}` })
    } catch (err) {
      await log.error('failed to write geography metadata', err.stack)
      return res.status(404).send({ result: 'not found' })
    }
  })
  return app
}

export { api }
