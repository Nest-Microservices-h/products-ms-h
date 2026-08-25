import 'dotenv/config';

import * as joi from 'joi';

interface EnvVars {
  PORT: number;
}

const envSchema = joi
  .object<EnvVars>({
    PORT: joi.number().required(),
  })
  .unknown(true);

const validationResult = envSchema.validate(process.env);

if (validationResult.error) {
  throw new Error(`Config validation error: ${validationResult.error.message}`);
}
const envVars: EnvVars = validationResult.value;

export const envs = {
  PORT: envVars.PORT,
};
