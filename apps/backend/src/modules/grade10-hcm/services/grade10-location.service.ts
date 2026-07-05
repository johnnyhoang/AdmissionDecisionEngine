import { Injectable } from '@nestjs/common';

type GeoSource = 'google' | 'nominatim' | 'map-url' | 'district-center' | 'fallback';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  formattedAddress?: string | null;
  mapUrl?: string | null;
  source: GeoSource;
  precision: 'exact' | 'approximate';
}

export interface LocationInput {
  name?: string;
  address?: string | null;
  districtName?: string;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TravelPoint {
  id?: string;
  name?: string;
  address?: string | null;
  districtName?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string | null;
}

export interface TravelResult extends GeoPoint {
  id?: string;
  name?: string;
  address?: string | null;
  districtName?: string | null;
  straightDistanceKm: number | null;
  roadDistanceKm: number | null;
  roadDurationMin: number | null;
  distanceSource: 'google' | 'osrm' | 'haversine' | 'district-center';
}

const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  'Quận 1': { lat: 10.7769, lng: 106.7009 },
  'Quận 3': { lat: 10.7792, lng: 106.6806 },
  'Quận 4': { lat: 10.758, lng: 106.7067 },
  'Quận 5': { lat: 10.7541, lng: 106.6624 },
  'Quận 6': { lat: 10.7481, lng: 106.6348 },
  'Quận 7': { lat: 10.734, lng: 106.7216 },
  'Quận 8': { lat: 10.7224, lng: 106.6293 },
  'Quận 10': { lat: 10.7747, lng: 106.6669 },
  'Quận 11': { lat: 10.7629, lng: 106.6508 },
  'Quận 12': { lat: 10.8671, lng: 106.6366 },
  'Bình Thạnh': { lat: 10.8106, lng: 106.7091 },
  'Gò Vấp': { lat: 10.8388, lng: 106.6661 },
  'Phú Nhuận': { lat: 10.7992, lng: 106.6803 },
  'Tân Bình': { lat: 10.7997, lng: 106.6461 },
  'Tân Phú': { lat: 10.7925, lng: 106.6183 },
  'Bình Tân': { lat: 10.7654, lng: 106.5828 },
  'Thủ Đức': { lat: 10.8494, lng: 106.7537 },
  'Nhà Bè': { lat: 10.6953, lng: 106.7246 },
  'Hóc Môn': { lat: 10.8842, lng: 106.5919 },
  'Củ Chi': { lat: 10.9996, lng: 106.495 },
  'Cần Giờ': { lat: 10.5083, lng: 106.8631 },
  'Bình Chánh': { lat: 10.6873, lng: 106.5753 },
};

@Injectable()
export class Grade10LocationService {
  private readonly geocodeCache = new Map<string, GeoPoint | null>();
  private readonly routeCache = new Map<string, { distanceKm: number; durationMin: number } | null>();

  private get googleMapsApiKey(): string {
    return (
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_GEOCODING_API_KEY ||
      process.env.GMAPS_API_KEY ||
      ''
    );
  }

  private get osrmBaseUrl(): string {
    return process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
  }

  private get googleMapsBase(): string {
    return 'https://maps.googleapis.com/maps/api';
  }

  hasGoogleRouting(): boolean {
    return Boolean(this.googleMapsApiKey);
  }

  private buildQuery(parts: Array<string | undefined | null>) {
    return parts.filter((part) => part && part.trim()).join(', ');
  }

  private buildMapsUrl(query: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  private parseCoordinatesFromMapUrl(mapUrl?: string | null) {
    if (!mapUrl) return null;

    const patterns = [
      /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
      /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
      /q=(-?\d+(?:\.\d+)?)%2C(-?\d+(?:\.\d+)?)/,
      /query=(-?\d+(?:\.\d+)?)%2C(-?\d+(?:\.\d+)?)/,
    ];

    for (const pattern of patterns) {
      const match = mapUrl.match(pattern);
      if (match) {
        const latitude = Number(match[1]);
        const longitude = Number(match[2]);
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          return { latitude, longitude };
        }
      }
    }

    return null;
  }

  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private districtFallback(districtName?: string | null) {
    const key = districtName?.trim();
    if (key && DISTRICT_COORDS[key]) {
      return { ...DISTRICT_COORDS[key], source: 'district-center' as const };
    }

    const compactKey = Object.keys(DISTRICT_COORDS).find((name) =>
      key?.toLowerCase().includes(name.toLowerCase()),
    );
    if (compactKey) {
      return { ...DISTRICT_COORDS[compactKey], source: 'district-center' as const };
    }

    return { lat: 10.7769, lng: 106.7009, source: 'fallback' as const };
  }

  private async fetchJson(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AdmissionDecisionEngine/1.0',
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when calling ${url}`);
    }

    return response.json();
  }

  async geocodeLocation(input: LocationInput): Promise<GeoPoint> {
    const cacheKey = JSON.stringify({
      name: input.name || '',
      address: input.address || '',
      districtName: input.districtName || '',
      mapUrl: input.mapUrl || '',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    });

    const cached = this.geocodeCache.get(cacheKey);
    if (cached) return cached;

    if (
      typeof input.latitude === 'number' &&
      Number.isFinite(input.latitude) &&
      typeof input.longitude === 'number' &&
      Number.isFinite(input.longitude)
    ) {
      const resolved: GeoPoint = {
        latitude: input.latitude,
        longitude: input.longitude,
        formattedAddress: this.buildQuery([
          input.name,
          input.address,
          input.districtName,
          'Hồ Chí Minh',
        ]),
        mapUrl:
          input.mapUrl ||
          this.buildMapsUrl(
            `${input.latitude},${input.longitude}`,
          ),
        source: 'map-url',
        precision: 'exact',
      };
      this.geocodeCache.set(cacheKey, resolved);
      return resolved;
    }

    const parsed = this.parseCoordinatesFromMapUrl(input.mapUrl);
    if (parsed) {
      const resolved: GeoPoint = {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        formattedAddress: this.buildQuery([
          input.name,
          input.address,
          input.districtName,
          'Hồ Chí Minh',
        ]),
        mapUrl: input.mapUrl || this.buildMapsUrl(`${parsed.latitude},${parsed.longitude}`),
        source: 'map-url',
        precision: 'exact',
      };
      this.geocodeCache.set(cacheKey, resolved);
      return resolved;
    }

    const query = this.buildQuery([
      input.name,
      input.address,
      input.districtName,
      'Hồ Chí Minh',
      'Việt Nam',
    ]);

    if (query) {
      const exact = await this.tryGoogleGeocode(query);
      if (exact) {
        this.geocodeCache.set(cacheKey, exact);
        return exact;
      }

      const fallback = await this.tryNominatimGeocode(query);
      if (fallback) {
        this.geocodeCache.set(cacheKey, fallback);
        return fallback;
      }
    }

    const fallbackPoint = this.districtFallback(input.districtName || input.address);
    const resolved: GeoPoint = {
      latitude: fallbackPoint.lat,
      longitude: fallbackPoint.lng,
      formattedAddress: query || input.name || input.address || null,
      mapUrl: this.buildMapsUrl(query || `${fallbackPoint.lat},${fallbackPoint.lng}`),
      source: fallbackPoint.source,
      precision: 'approximate',
    };

    this.geocodeCache.set(cacheKey, resolved);
    return resolved;
  }

  async searchLocations(query: string, limit = 5): Promise<GeoPoint[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const normalizedQuery = this.buildQuery([
      cleanQuery,
      cleanQuery.toLowerCase().includes('hcm') ||
      cleanQuery.toLowerCase().includes('hồ chí minh')
        ? null
        : 'Hồ Chí Minh',
      'Việt Nam',
    ]);
    const maxResults = Math.min(Math.max(Number(limit) || 5, 1), 8);

    const googleResults = await this.searchGoogleGeocode(
      normalizedQuery,
      maxResults,
    );
    if (googleResults.length > 0) return googleResults;

    return this.searchNominatimGeocode(normalizedQuery, maxResults);
  }

  private async tryGoogleGeocode(query: string): Promise<GeoPoint | null> {
    if (!this.googleMapsApiKey) return null;

    try {
      const url = new URL(`${this.googleMapsBase}/geocode/json`);
      url.searchParams.set('address', query);
      url.searchParams.set('key', this.googleMapsApiKey);
      const data = await this.fetchJson(url.toString());
      const result = data?.results?.[0];
      if (!result?.geometry?.location) return null;

      const latitude = Number(result.geometry.location.lat);
      const longitude = Number(result.geometry.location.lng);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

      return {
        latitude,
        longitude,
        formattedAddress: result.formatted_address || query,
        mapUrl: this.buildMapsUrl(`${latitude},${longitude}`),
        source: 'google',
        precision: 'exact',
      };
    } catch {
      return null;
    }
  }

  private async searchGoogleGeocode(
    query: string,
    limit: number,
  ): Promise<GeoPoint[]> {
    if (!this.googleMapsApiKey) return [];

    try {
      const url = new URL(`${this.googleMapsBase}/geocode/json`);
      url.searchParams.set('address', query);
      url.searchParams.set('components', 'country:VN');
      url.searchParams.set('key', this.googleMapsApiKey);
      const data = await this.fetchJson(url.toString());
      const results = Array.isArray(data?.results) ? data.results : [];

      return results
        .slice(0, limit)
        .map((result: any) => {
          const latitude = Number(result?.geometry?.location?.lat);
          const longitude = Number(result?.geometry?.location?.lng);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            latitude,
            longitude,
            formattedAddress: result.formatted_address || query,
            mapUrl: this.buildMapsUrl(`${latitude},${longitude}`),
            source: 'google' as const,
            precision: 'exact' as const,
          };
        })
        .filter(Boolean) as GeoPoint[];
    } catch {
      return [];
    }
  }

  private async tryNominatimGeocode(query: string): Promise<GeoPoint | null> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');
      const data = await this.fetchJson(url.toString());
      const result = Array.isArray(data) ? data[0] : null;
      if (!result?.lat || !result?.lon) return null;

      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

      return {
        latitude,
        longitude,
        formattedAddress: result.display_name || query,
        mapUrl: this.buildMapsUrl(`${latitude},${longitude}`),
        source: 'nominatim',
        precision: 'exact',
      };
    } catch {
      return null;
    }
  }

  private async searchNominatimGeocode(
    query: string,
    limit: number,
  ): Promise<GeoPoint[]> {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('countrycodes', 'vn');
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('addressdetails', '1');
      const data = await this.fetchJson(url.toString());
      const results = Array.isArray(data) ? data : [];

      return results
        .map((result: any) => {
          const latitude = Number(result.lat);
          const longitude = Number(result.lon);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return {
            latitude,
            longitude,
            formattedAddress: result.display_name || query,
            mapUrl: this.buildMapsUrl(`${latitude},${longitude}`),
            source: 'nominatim' as const,
            precision: 'exact' as const,
          };
        })
        .filter(Boolean) as GeoPoint[];
    } catch {
      return [];
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeoPoint> {
    const cacheKey = `reverse:${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const cached = this.geocodeCache.get(cacheKey);
    if (cached) return cached;

    let formattedAddress: string | null = null;
    let source: GeoSource = 'fallback';

    if (this.googleMapsApiKey) {
      try {
        const url = new URL(`${this.googleMapsBase}/geocode/json`);
        url.searchParams.set('latlng', `${latitude},${longitude}`);
        url.searchParams.set('key', this.googleMapsApiKey);
        const data = await this.fetchJson(url.toString());
        formattedAddress = data?.results?.[0]?.formatted_address ?? null;
        if (formattedAddress) source = 'google';
      } catch {
        // fall through to Nominatim
      }
    }

    if (!formattedAddress) {
      try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('lat', String(latitude));
        url.searchParams.set('lon', String(longitude));
        url.searchParams.set('format', 'json');
        const data = await this.fetchJson(url.toString());
        formattedAddress = data?.display_name ?? null;
        if (formattedAddress) source = 'nominatim';
      } catch {
        // keep coordinates-only result
      }
    }

    const resolved: GeoPoint = {
      latitude,
      longitude,
      formattedAddress,
      mapUrl: this.buildMapsUrl(`${latitude},${longitude}`),
      source,
      precision: 'exact',
    };

    this.geocodeCache.set(cacheKey, resolved);
    return resolved;
  }

  async resolveOrigin(input: LocationInput) {
    return this.geocodeLocation(input);
  }

  async calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ) {
    const cacheKey = `${origin.latitude},${origin.longitude}|${destination.latitude},${destination.longitude}`;
    const cached = this.routeCache.get(cacheKey);
    if (cached) return cached;

    if (this.googleMapsApiKey) {
      try {
        const url = new URL(`${this.googleMapsBase}/distancematrix/json`);
        url.searchParams.set(
          'origins',
          `${origin.latitude},${origin.longitude}`,
        );
        url.searchParams.set(
          'destinations',
          `${destination.latitude},${destination.longitude}`,
        );
        url.searchParams.set('mode', 'driving');
        url.searchParams.set('units', 'metric');
        url.searchParams.set('key', this.googleMapsApiKey);
        const data = await this.fetchJson(url.toString());
        const element = data?.rows?.[0]?.elements?.[0];
        if (element?.status === 'OK') {
          const result = {
            distanceKm: Number((element.distance.value / 1000).toFixed(2)),
            durationMin: Math.max(1, Math.round(element.duration.value / 60)),
          };
          this.routeCache.set(cacheKey, result);
          return result;
        }
      } catch {
        // fall through
      }
    }

    try {
      const url = new URL(
        `${this.osrmBaseUrl}/table/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`,
      );
      url.searchParams.set('sources', '0');
      const data = await this.fetchJson(url.toString());
      const distanceMeters = data?.distances?.[0]?.[1];
      const durationSeconds = data?.durations?.[0]?.[1];
      if (typeof distanceMeters === 'number') {
        const result = {
          distanceKm: Number((distanceMeters / 1000).toFixed(2)),
          durationMin:
            typeof durationSeconds === 'number'
              ? Math.max(1, Math.round(durationSeconds / 60))
              : Math.max(1, Math.round((distanceMeters / 1000) * 3)),
        };
        this.routeCache.set(cacheKey, result);
        return result;
      }
    } catch {
      // fall through
    }

    const distanceKm = this.haversineKm(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    );
    const result = {
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMin: Math.max(1, Math.round(distanceKm * 3)),
    };
    this.routeCache.set(cacheKey, result);
    return result;
  }

  async calculateRouteBatch(
    origin: { latitude: number; longitude: number },
    destinations: Array<{ latitude: number; longitude: number }>,
  ) {
    const cleanDestinations = destinations.filter(
      (item) =>
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number',
    );

    if (cleanDestinations.length === 0) return [];

    if (this.googleMapsApiKey) {
      try {
        const url = new URL(`${this.googleMapsBase}/distancematrix/json`);
        url.searchParams.set(
          'origins',
          `${origin.latitude},${origin.longitude}`,
        );
        url.searchParams.set(
          'destinations',
          cleanDestinations
            .map((item) => `${item.latitude},${item.longitude}`)
            .join('|'),
        );
        url.searchParams.set('mode', 'driving');
        url.searchParams.set('units', 'metric');
        url.searchParams.set('key', this.googleMapsApiKey);
        const data = await this.fetchJson(url.toString());
        const elements = data?.rows?.[0]?.elements || [];
        const results = elements.map((element: any) => {
          if (element?.status === 'OK') {
            return {
              distanceKm: Number((element.distance.value / 1000).toFixed(2)),
              durationMin: Math.max(1, Math.round(element.duration.value / 60)),
            };
          }
          return null;
        });
        if (results.some((item: any) => item !== null)) return results;
      } catch {
        // fall through
      }
    }

    try {
      const coords = [
        `${origin.longitude},${origin.latitude}`,
        ...cleanDestinations.map(
          (item) => `${item.longitude},${item.latitude}`,
        ),
      ].join(';');
      const url = new URL(`${this.osrmBaseUrl}/table/v1/driving/${coords}`);
      url.searchParams.set('sources', '0');
      const data = await this.fetchJson(url.toString());
      const distances = data?.distances?.[0] || [];
      const durations = data?.durations?.[0] || [];
      return cleanDestinations.map((_, index) => ({
        distanceKm:
          typeof distances[index + 1] === 'number'
            ? Number((distances[index + 1] / 1000).toFixed(2))
            : null,
        durationMin:
          typeof durations[index + 1] === 'number'
            ? Math.max(1, Math.round(durations[index + 1] / 60))
            : null,
      }));
    } catch {
      return cleanDestinations.map((item) => ({
        distanceKm: Number(
          this.haversineKm(
            origin.latitude,
            origin.longitude,
            item.latitude,
            item.longitude,
          ).toFixed(2),
        ),
        durationMin: null,
      }));
    }
  }

  async enrichTravelPoints(origin: LocationInput, points: TravelPoint[]) {
    const resolvedOrigin = await this.geocodeLocation(origin);
    const resolvedPoints = await Promise.all(
      points.map(async (point) => {
        const resolved = await this.geocodeLocation({
          ...point,
          mapUrl: point.mapUrl ?? undefined,
        });
        const straightDistanceKm = this.haversineKm(
          resolvedOrigin.latitude,
          resolvedOrigin.longitude,
          resolved.latitude,
          resolved.longitude,
        );
        return {
          ...point,
          ...resolved,
          straightDistanceKm: Number(straightDistanceKm.toFixed(2)),
          roadDistanceKm: null as number | null,
          roadDurationMin: null as number | null,
          distanceSource: resolved.source === 'district-center' ? 'district-center' : 'haversine',
        } satisfies TravelResult;
      }),
    );

    const routable = resolvedPoints.filter(
      (point) =>
        typeof point.latitude === 'number' &&
        typeof point.longitude === 'number',
    );

    if (routable.length === 0) {
      return resolvedPoints;
    }

    const batchRoutes = await this.calculateRouteBatch(
      resolvedOrigin,
      routable.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    );

    const routeResults = routable.map((point, index) => ({
      ...point,
      roadDistanceKm: batchRoutes[index]?.distanceKm ?? null,
      roadDurationMin: batchRoutes[index]?.durationMin ?? null,
      distanceSource: this.googleMapsApiKey ? 'google' : 'osrm',
    })) as TravelResult[];

    const routeMap = new Map(
      routeResults.map((point) => [`${point.latitude},${point.longitude}`, point]),
    );

    return resolvedPoints.map((point) => {
      const routed = routeMap.get(`${point.latitude},${point.longitude}`);
      return routed || point;
    });
  }
}
