import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller()
export class AppController {
	@ApiOperation({ summary: 'Hello World' })
	@Get()
	getHello(): string {
		return 'Hello World!';
	}
}
