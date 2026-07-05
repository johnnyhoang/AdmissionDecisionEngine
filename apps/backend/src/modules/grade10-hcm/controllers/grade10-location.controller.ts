import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';
import { CurrentUser } from '../../auth/current-user.decorator';
import {
  Grade10LocationService,
  LocationInput,
  TravelPoint,
} from '../services/grade10-location.service';
import { Grade10SchoolService } from '../services/grade10-school.service';

@ApiTags('grade10-hcm-location')
@Controller('api/v1/grade10-hcm/location')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class Grade10LocationController {
  constructor(
    private readonly locationService: Grade10LocationService,
    private readonly schoolService: Grade10SchoolService,
  ) {}

  @Post('geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve an address or school location to coordinates' })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async geocode(@Body() body: LocationInput) {
    return this.locationService.geocodeLocation(body);
  }

  @Post('reverse-geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve coordinates back to a human-readable address' })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async reverseGeocode(@Body() body: { latitude: number; longitude: number }) {
    return this.locationService.reverseGeocode(body.latitude, body.longitude);
  }

  @Post('nearby-schools')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find nearby Grade 10 schools and return route-aware distance' })
  @RequirePermission('GRADE10', 'view_dashboard', 'view')
  async nearbySchools(
    @Body()
    body: {
      userLat: number;
      userLon: number;
      limit?: number;
      maxDistanceKm?: number;
      search?: string;
      districtId?: string;
    },
    @CurrentUser() user?: { role?: string },
  ) {
    return this.schoolService.findNearbySchools({
      userLat: body.userLat,
      userLon: body.userLon,
      limit: body.limit,
      maxDistanceKm: body.maxDistanceKm,
      search: body.search,
      districtId: body.districtId,
      includeDataCompleteness: user?.role === 'ADMIN',
    });
  }

  @Post('travel-points')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a batch of destination points and return road distance' })
  @RequirePermission('GRADE10', 'view_recommendation', 'view')
  async travelPoints(
    @Body()
    body: {
      origin: LocationInput;
      points: TravelPoint[];
    },
  ) {
    return this.locationService.enrichTravelPoints(body.origin, body.points);
  }
}
