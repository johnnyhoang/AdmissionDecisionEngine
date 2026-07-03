import { Grade10School } from './school.entity';
export declare class Grade10District {
    id: string;
    name: string;
    code: string;
    schools: Grade10School[];
    createdAt: Date;
    updatedAt: Date;
}
