import { University } from './university.entity';
import { Program } from './program.entity';
export declare class Campus {
    id: string;
    universityId: string;
    name: string;
    address: string;
    city: string;
    university: University;
    programs: Program[];
    createdAt: Date;
    updatedAt: Date;
}
