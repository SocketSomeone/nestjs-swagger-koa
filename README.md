<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
    A module for generating Swagger documentation for Koa applications in <a href="https://nestjs.com/" target="_blank">NestJS</a>.
</p>

<p align="center">
    <a href='https://img.shields.io/npm/v/nestjs-swagger-koa'><img src="https://img.shields.io/npm/v/nestjs-swagger-koa" alt="NPM Version" /></a>
    <a href='https://img.shields.io/npm/l/nestjs-swagger-koa'><img src="https://img.shields.io/npm/l/nestjs-swagger-koa" alt="NPM License" /></a>
    <a href='https://img.shields.io/npm/dm/nestjs-swagger-koa'><img src="https://img.shields.io/npm/dm/nestjs-swagger-koa" alt="NPM Downloads" /></a>
    <a href='https://img.shields.io/github/last-commit/SocketSomeone/nestjs-swagger-koa'><img src="https://img.shields.io/github/last-commit/SocketSomeone/nestjs-swagger-koa" alt="Last commit" /></a>
</p>


## About

This library is a NestJS module for generating Swagger documentation for Koa applications. Was created due this [issue](
https://github.com/nestjs/swagger/pull/2351) in the official NestJS Swagger module. Also, this library is based on the official NestJS
Swagger module and NestJS Koa adapter.

## Installation

```bash
$ npm install --save nestjs-swagger-koa @nestjs/swagger nest-koa-adapter
$ yarn add nestjs-swagger-koa @nestjs/swagger nest-koa-adapter
$ pnpm add nestjs-swagger-koa @nestjs/swagger nest-koa-adapter
```

## Usage

Usage was not changed from the official NestJS Swagger module. You can find the usage in the official
documentation [here](https://docs.nestjs.com/openapi/introduction).
All you need to do is to replace the `@nestjs/swagger` module with `nestjs-swagger-koa` and import the `NestKoaAdapter`
from `nest-koa-adapter`. Here is an example:

```typescript
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { KoaSwaggerModule } from 'nestjs-swagger-koa';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle('Cats example')
        .setDescription('The cats API description')
        .setVersion('1.0')
        .addTag('cats')
        .build();
    const document = KoaSwaggerModule.createDocument(app, config);
    KoaSwaggerModule.setup('api', app, document);

    await app.listen(3000);
}

bootstrap();
```

## Stay in touch

* Author - [Alexey Filippov](https://t.me/socketsomeone)
* Twitter - [@SocketSomeone](https://twitter.com/SocketSomeone)

## License

[MIT](https://github.com/SocketSomeone/nestjs-swagger-koa/blob/master/LICENSE) © [Alexey Filippov](https://github.com/SocketSomeone)
