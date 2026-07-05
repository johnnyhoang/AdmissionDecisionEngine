import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10District } from '../entities/district.entity';
import { Grade10Quota } from '../entities/quota.entity';
import { Grade10Cutoff } from '../entities/cutoff.entity';
import { Grade10ImportLog } from '../entities/import-log.entity';
import { Grade10LocationService } from './grade10-location.service';
import { deduplicateDistrictsHelper } from '../utils/district-dedup.util';
import { deduplicateSchoolsHelper } from '../utils/school-dedup.util';

export interface ImportQuotaDto {
  year: number;
  quota: number;
  registeredCount?: number | null;
  competitionRatio?: number | null;
  programType?: string;
}

export interface ImportCutoffDto {
  year: number;
  cutoffNV1: number;
  cutoffNV2?: number;
  cutoffNV3?: number;
  lowestScore?: number;
  highestScore?: number;
  programType?: string;
  notes?: string;
  changes?: string;
  dataSource?: string;
}

export interface ImportSchoolDto {
  code: string;
  name: string;
  address?: string;
  website?: string;
  description?: string;
  activities?: string;
  regulations?: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  schoolType?: string;
  quotas?: ImportQuotaDto[];
  cutoffs?: ImportCutoffDto[];
}

export interface ImportDistrictDto {
  code: string;
  name: string;
  schools: ImportSchoolDto[];
}

export interface Grade10ImportPayload {
  sourceName: string;
  sourceUrl?: string;
  dataYear: number;
  districts: ImportDistrictDto[];
}

@Injectable()
export class Grade10ImportService {
  private readonly logger = new Logger(Grade10ImportService.name);

  constructor(
    @InjectRepository(Grade10School)
    private readonly schoolRepo: Repository<Grade10School>,
    @InjectRepository(Grade10District)
    private readonly districtRepo: Repository<Grade10District>,
    @InjectRepository(Grade10Quota)
    private readonly quotaRepo: Repository<Grade10Quota>,
    @InjectRepository(Grade10Cutoff)
    private readonly cutoffRepo: Repository<Grade10Cutoff>,
    @InjectRepository(Grade10ImportLog)
    private readonly logRepo: Repository<Grade10ImportLog>,
    private readonly locationService: Grade10LocationService,
  ) {}

  private resolveDataDir(): string {
    const fs = require('fs');
    const path = require('path');

    let dir = path.join(process.cwd(), 'data', 'imports');
    if (fs.existsSync(dir)) return dir;

    dir = path.join(process.cwd(), '..', '..', 'data', 'imports');
    if (fs.existsSync(dir)) return dir;

    dir = path.join(__dirname, '..', '..', '..', '..', '..', 'data', 'imports');
    if (fs.existsSync(dir)) return dir;

    return path.join(process.cwd(), 'data', 'imports');
  }

  async getPresets() {
    const fs = require('fs');
    const path = require('path');
    const dataDir = this.resolveDataDir();
    if (!fs.existsSync(dataDir)) {
      return [];
    }
    const files = fs
      .readdirSync(dataDir)
      .filter((f: string) => f.startsWith('g10hcm_') && f.endsWith('.json'));
    const presets = [];
    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const content = JSON.parse(
          fs.readFileSync(filePath, 'utf8'),
        ) as Grade10ImportPayload;

        let schoolCount = 0;
        let quotaCount = 0;
        let cutoffCount = 0;
        content.districts?.forEach((d) => {
          schoolCount += d.schools?.length || 0;
          d.schools?.forEach((s) => {
            quotaCount += s.quotas?.length || 0;
            cutoffCount += s.cutoffs?.length || 0;
          });
        });

        presets.push({
          filename: file,
          sourceName: content.sourceName,
          sourceUrl: content.sourceUrl,
          dataYear: content.dataYear,
          districtsCount: content.districts?.length || 0,
          schoolsCount: schoolCount,
          quotasCount: quotaCount,
          cutoffsCount: cutoffCount,
        });
      } catch (e) {
        // Skip invalid JSON
      }
    }
    return presets;
  }

  async runPreset(filename: string) {
    const fs = require('fs');
    const path = require('path');
    const dataDir = this.resolveDataDir();
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }
    const payload = JSON.parse(
      fs.readFileSync(filePath, 'utf8'),
    ) as Grade10ImportPayload;
    return this.importData(payload);
  }

  async importData(payload: Grade10ImportPayload) {
    let schoolsAdded = 0;
    let schoolsUpdated = 0;
    let quotasAdded = 0;
    let cutoffsAdded = 0;
    const errors: string[] = [];

    for (const distDto of payload.districts) {
      try {
        // 1. Upsert District
        let district = await this.districtRepo.findOne({
          where: { code: distDto.code },
        });
        if (!district) {
          district = this.districtRepo.create({
            code: distDto.code,
            name: distDto.name,
          });
          district = await this.districtRepo.save(district);
        }

        // 2. Upsert Schools
        if (distDto.schools?.length) {
          for (const schoolDto of distDto.schools) {
            try {
              let school = await this.schoolRepo.findOne({
                where: { code: schoolDto.code },
              });
              if (school) {
                const resolvedLocation = await this.locationService.geocodeLocation({
                  name: schoolDto.name,
                  address: schoolDto.address,
                  districtName: distDto.name,
                  mapUrl: schoolDto.mapUrl || school.mapUrl,
                  latitude: schoolDto.latitude ?? school.latitude,
                  longitude: schoolDto.longitude ?? school.longitude,
                });
                school.name = schoolDto.name || school.name;
                school.address = schoolDto.address || school.address;
                school.website = schoolDto.website || school.website;
                school.description = schoolDto.description || school.description;
                school.activities = schoolDto.activities || school.activities;
                school.regulations = schoolDto.regulations || school.regulations;
                school.schoolType = schoolDto.schoolType || school.schoolType;
                school.districtId = district.id;
                school.latitude = schoolDto.latitude ?? resolvedLocation.latitude;
                school.longitude = schoolDto.longitude ?? resolvedLocation.longitude;
                school.mapUrl =
                  schoolDto.mapUrl ?? school.mapUrl ?? resolvedLocation.mapUrl ?? null;
                await this.schoolRepo.save(school);
                schoolsUpdated++;
              } else {
                const resolvedLocation = await this.locationService.geocodeLocation({
                  name: schoolDto.name,
                  address: schoolDto.address,
                  districtName: distDto.name,
                  mapUrl: schoolDto.mapUrl,
                  latitude: schoolDto.latitude,
                  longitude: schoolDto.longitude,
                });
                school = this.schoolRepo.create({
                  code: schoolDto.code,
                  name: schoolDto.name,
                  address: schoolDto.address,
                  website: schoolDto.website,
                  description: schoolDto.description,
                  activities: schoolDto.activities,
                  regulations: schoolDto.regulations,
                  schoolType: schoolDto.schoolType || 'REGULAR',
                  districtId: district.id,
                  latitude: schoolDto.latitude ?? resolvedLocation.latitude,
                  longitude: schoolDto.longitude ?? resolvedLocation.longitude,
                  mapUrl: schoolDto.mapUrl ?? resolvedLocation.mapUrl ?? null,
                });
                school = await this.schoolRepo.save(school);
                schoolsAdded++;
              }

              // 3. Upsert Quotas
              if (schoolDto.quotas?.length) {
                for (const qDto of schoolDto.quotas) {
                  const pt = qDto.programType || 'REGULAR';
                  let quota = await this.quotaRepo.findOne({
                    where: {
                      schoolId: school.id,
                      year: qDto.year,
                      programType: pt,
                    },
                  });
                  if (!quota) {
                    quota = this.quotaRepo.create({
                      schoolId: school.id,
                      year: qDto.year,
                      quota: qDto.quota,
                      registeredCount:
                        qDto.registeredCount === undefined
                          ? 0
                          : qDto.registeredCount,
                      competitionRatio:
                        qDto.competitionRatio === undefined
                          ? 0
                          : qDto.competitionRatio,
                      programType: pt,
                    });
                    await this.quotaRepo.save(quota);
                    quotasAdded++;
                  } else {
                    quota.quota = qDto.quota;
                    if (qDto.registeredCount !== undefined) {
                      quota.registeredCount = qDto.registeredCount;
                    }
                    if (qDto.competitionRatio !== undefined) {
                      quota.competitionRatio = qDto.competitionRatio;
                    }
                    await this.quotaRepo.save(quota);
                  }
                }
              }

              // 4. Upsert Cutoffs
              if (schoolDto.cutoffs?.length) {
                for (const cDto of schoolDto.cutoffs) {
                  const pt = cDto.programType || 'REGULAR';
                  let cutoff = await this.cutoffRepo.findOne({
                    where: {
                      schoolId: school.id,
                      year: cDto.year,
                      programType: pt,
                    },
                  });
                  if (!cutoff) {
                    cutoff = this.cutoffRepo.create({
                      schoolId: school.id,
                      year: cDto.year,
                      cutoffNV1: cDto.cutoffNV1,
                      cutoffNV2: cDto.cutoffNV2,
                      cutoffNV3: cDto.cutoffNV3,
                      lowestScore: cDto.lowestScore,
                      highestScore: cDto.highestScore,
                      programType: pt,
                      notes: cDto.notes,
                      changes: cDto.changes,
                      dataSource: cDto.dataSource || payload.sourceUrl,
                    });
                    await this.cutoffRepo.save(cutoff);
                    cutoffsAdded++;
                  } else {
                    cutoff.cutoffNV1 = cDto.cutoffNV1;
                    cutoff.cutoffNV2 = cDto.cutoffNV2 || cutoff.cutoffNV2;
                    cutoff.cutoffNV3 = cDto.cutoffNV3 || cutoff.cutoffNV3;
                    cutoff.lowestScore = cDto.lowestScore || cutoff.lowestScore;
                    cutoff.highestScore =
                      cDto.highestScore || cutoff.highestScore;
                    cutoff.notes = cDto.notes || cutoff.notes;
                    await this.cutoffRepo.save(cutoff);
                  }
                }
              }
            } catch (e) {
              errors.push(`School error ${schoolDto.name}: ${e.message}`);
            }
          }
        }
      } catch (e) {
        errors.push(`District error ${distDto.name}: ${e.message}`);
      }
    }

    // Save Log
    const totalRows =
      schoolsAdded + schoolsUpdated + quotasAdded + cutoffsAdded;
    const log = this.logRepo.create({
      sourceName: payload.sourceName,
      sourceUrl: payload.sourceUrl || undefined,
      status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
      rowsCount: totalRows,
      notes: errors.length > 0 ? errors.slice(0, 5).join('\n') : undefined,
    });
    await this.logRepo.save(log);

    // Auto deduplicate districts and merge relationships immediately after import
    await deduplicateDistrictsHelper(this.schoolRepo, this.districtRepo);
    await deduplicateSchoolsHelper(this.schoolRepo, this.quotaRepo, this.cutoffRepo);

    return {
      schoolsAdded,
      schoolsUpdated,
      quotasAdded,
      cutoffsAdded,
      errors,
    };
  }

  async getImportHistory() {
    return this.logRepo.find({ order: { createdAt: 'DESC' }, take: 50 });
  }
}
