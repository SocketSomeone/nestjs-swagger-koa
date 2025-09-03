import { NestFactory } from '@nestjs/core';
import { KoaAdapter, NestKoaApplication } from 'nest-koa-adapter';
import { AppModule } from './app.module';
import { KoaSwaggerModule } from '../src';
import { DocumentBuilder } from '@nestjs/swagger';

export async function bootstrap() {
	const app = await NestFactory.create<NestKoaApplication>(AppModule, new KoaAdapter());

	const config = new DocumentBuilder().setTitle('Test').setVersion('1.0').build();

	const document = KoaSwaggerModule.createDocument(app, config);

	KoaSwaggerModule.setup('/swagger', app, document);

	return app.listen(1322);
}

void bootstrap();
