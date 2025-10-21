import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeoLocationService } from './geo-location.service';

@Module({
  imports: [HttpModule],
  providers: [GeoLocationService],
  exports: [GeoLocationService],
})
export class GeoLocationModule {}


