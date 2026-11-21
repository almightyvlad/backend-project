import { randomUUID } from 'crypto'
import type { ConfigType } from '@nestjs/config'
import type { ClsService } from 'nestjs-cls'
import type { Params } from 'nestjs-pino'
import type { loggerConfig } from './logger.config.js'
import { REQUEST_ID_KEY } from './request-context.js'

export function createLoggerModuleOptions(
  config: ConfigType<typeof loggerConfig>,
  cls: ClsService,
): Params {
  return {
    pinoHttp: {
      level: config.level,
      redact: ['req.headers.authorization'],
      mixin: () => {
        if (!cls.isActive()) {
          return {}
        }

        const requestId = cls.get<string | undefined>(REQUEST_ID_KEY)
        return requestId ? { requestId } : {}
      },
      genReqId: (req, res) => {
        const existingID = req.id ?? req.headers['x-request-id']

        if (typeof existingID === 'string' && existingID.length > 0) {
          res.setHeader('X-Request-Id', existingID)
          return existingID
        }

        const id = randomUUID()
        res.setHeader('X-Request-Id', id)
        return id
      },
    },
  }
}
