import { Repository } from 'typeorm';
import { Grade10School } from '../entities/school.entity';
import { Grade10District } from '../entities/district.entity';

export async function deduplicateDistrictsHelper(
  schoolRepo: Repository<Grade10School>,
  districtRepo: Repository<Grade10District>
) {
  console.log('Running Grade 10 HCM District Deduplication & Merge...');
  try {
    const districts = await districtRepo.find();
    
    // Helper to normalize district name
    const normalize = (name: string): string => {
      if (!name) return '';
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/^(quan|huyen|thanh pho|tp\.?|q\.?|h\.?)\s+/g, '') // remove prefixes
        .trim();
    };

    // Group districts by normalized name
    const groups: Record<string, Grade10District[]> = {};
    for (const dist of districts) {
      const norm = normalize(dist.name);
      if (!groups[norm]) {
        groups[norm] = [];
      }
      groups[norm].push(dist);
    }

    // Merge groups with size > 1
    for (const key of Object.keys(groups)) {
      const group = groups[key];
      if (group.length <= 1) continue;

      // Choose the one with the shortest name (e.g. "Tân Phú" instead of "Quận Tân Phú")
      group.sort((a, b) => a.name.length - b.name.length);
      const keepDistrict = group[0];
      const duplicates = group.slice(1);

      console.log(`Merging duplicates for ${keepDistrict.name} (keeping ID: ${keepDistrict.id})...`);

      for (const dup of duplicates) {
        console.log(`- Merging ${dup.name} (ID: ${dup.id}) into ${keepDistrict.name}...`);
        
        // Re-link schools
        const schoolsToUpdate = await schoolRepo.find({
          where: { districtId: dup.id },
        });
        
        if (schoolsToUpdate.length > 0) {
          console.log(`  Updating ${schoolsToUpdate.length} schools linked to ${dup.name}...`);
          for (const school of schoolsToUpdate) {
            school.districtId = keepDistrict.id;
            await schoolRepo.save(school);
          }
        }

        // Delete the duplicate district
        await districtRepo.remove(dup);
      }
    }
    console.log('District deduplication and merge completed successfully!');
  } catch (e: any) {
    console.error('Error during district deduplication:', e);
  }
}
