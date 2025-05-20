import { Chapter } from "./Chapter";

export interface ComprehensiveCourseData {

    courseChapters: Chapter[];
    courseTitle: string;
    courseDescription: string;
    learningObjectives: string;
    topic: string;

}