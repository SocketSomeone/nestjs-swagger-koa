import type { NestKoaApplication } from 'nest-koa-adapter';

import { DocumentBuilder } from '@nestjs/swagger';
import { KoaAdapter } from 'nest-koa-adapter';
import { NestFactory } from '@nestjs/core';

import { KoaSwaggerModule } from '../src/index.js';
import { AppModule } from './app.module.js';

export async function bootstrap() {
	const app = await NestFactory.create<NestKoaApplication>(AppModule, new KoaAdapter());

	const config = new DocumentBuilder().setTitle('Test').setVersion('1.0').build();

	const document = KoaSwaggerModule.createDocument(app, config);

	KoaSwaggerModule.setup('/swagger', app, document);

	return app.listen(1322);
}

void bootstrap();
