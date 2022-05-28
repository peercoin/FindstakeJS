import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { urlencoded, json } from 'express';
import { PPCRPC } from 'src/utils/rpc';
const config = require('./config/index');

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  allowedHeaders: '*',
};

async function bootstrap(app: INestApplication) {
  app.enableCors(corsOptions);

  await app.listen(config.web.port);
}

async function bootstrapWhenNodeIsReady() {
  let ready = false;
  try {
    ready = await PPCRPC().isReady();
  } catch (error) {
    ready = false;
  }

  if (!ready) {
    console.log('retry after 1 sec ' + config.rpcs.localNode);
    return setTimeout(bootstrapWhenNodeIsReady, 1000);
  }
  
  const app = await NestFactory.create(AppModule);
 
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));


  return bootstrap(app);
}

bootstrapWhenNodeIsReady();
