import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service.js'
import { Public } from '@app/common'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello() {
    return this.appService.getHello()
  }
}
