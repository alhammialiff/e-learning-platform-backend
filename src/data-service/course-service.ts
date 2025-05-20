// import { DummyData } from "../models/DummyData";
import { Course } from "../model/Course";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentTimestamp } from "./time-service";
import multer from "multer";
import { FileMetaData } from "../model/FileMetaData";
import { get } from "http";
import { ComprehensiveCourseData } from "../model/ComprehensiveCourseData";
import { Section } from "../model/Section";
import { SectionMultimedia } from "../model/SectionMultimedia";
import { Chapter } from "../model/Chapter";

var path = require('path');
const pgp = require('pg-promise')();

// =================================
// Multer File Upload Config
// =================================
// const uploadMultimediaToFileSystem = (sectionID: string) =>{

//     const uploadHandler = multer({
  
//         storage: multer.diskStorage({
      
//           destination: (req: any, file: FileMetaData, cb: any) => {
      
//             cb(null, __dirname + "/course-multimedia/")
      
//           },
      
//           filename: (req: any, file: FileMetaData, cb: any) => {
      
//             const uniqueSuffix = Math.round(Math.random() * 1E9);
//             const fileNameWithoutExtension = file.originalname.split('.')[0];
//             const fileExtension = file.originalname.split('.')[1];
//             const reconstructedFileName = fileNameWithoutExtension + '-' + sectionID + '.' + fileExtension;
      
//             cb(null, reconstructedFileName);
      
//           }
      
//         })
      
//       });
      
//     return uploadHandler;

// }




const getDBTools = () => {
    
    // ================================================
    // DEV ENV TYPE 1: LOCALHOST DB CONNECTION
    //                 Use this when developing locally 
    //                 Frontend -> localhost:4200
    //                 Backend  -> localhost:3000
    //                 DB       -> localhost:5432
    // ================================================
    // const db = pgp('postgres://postgres:password@localhost:5432/LMS-249-Prototype-DB');
    const db = pgp('postgres://postgres:password@localhost:5432/postgres');
    
    
    // ===========================================================================
    // DEV ENV TYPE 2: DOCKER COMPOSE DB CONNECTION
    //                 Use this when developing locally
    //                 Frontend  -> DHCP_ASSIGNED_IP:8080
    //                 Backend   -> DHCP_ASSIGNED_IP:8081
    //                 DB        -> DHCP_ASSIGNED_IP:5432
    // ===========================================================================
    // const db = pgp('postgres://postgres:password@db:5432/Internal-BI-DB');

    const { ParameterizedQuery: PQ } = pgp;      

    return {
        postgresDB: db,
        PQ: PQ
    }
}

const { postgresDB, PQ } = getDBTools();


// ===============================================================================
// GET ALL COURSES BY USER ID
// ===============================================================================
export const getAllCoursesByUserID = (req: Request, res: Response, next: NextFunction) => {

    const dummyData: any = {...req.body};
    const userID: string = req.body.userID;

    console.log(dummyData);
    
    const query = new PQ({
        text: `SELECT * FROM public.\"enrollments\" WHERE userid = $1`
    });

    if(!req.body){

        return res.status(400).json({
            status: 400,
            error: '[Error] Empty request body'
        })

    }

    query.values = [
        // dummyData.id
        userID
    ]

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getAllCoursesByUserID] Response: ", response);

            return res.status(200).json({
                status: 200,
                message: '[Success] Courses by User ID retrieved',
                data: response
            });
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return res.status(500).json({ 
                status: 500,
                message: error,
                data: null
            });
        
        });

};

// ===============================================================================
// (1) Get Comprehensive Course Data (Commence data consolidation from Courses, Chapters, Sections, Materials)
// ===============================================================================
export const getComprehensiveCourseData = (req: Request, res: Response, next: NextFunction) => {

    const courseID: string = req.body.data.courseID;
    var chapterID: string;
    var sectionID: string;

    var courseData: any;
    var chapterData: any[] = [];
    var sectionData: any[] = [];
    var materialData: any[] = [];

    // const courseObject: any = {};
    
    // 1. Select Course By ID Query
    const queryChain = getOverviewCourseDataByCourseID(req, res, next)
        .then((response: any) => {

            courseData = response.data[0];
            
            // 2. Select Chapters By Course ID
            return getChaptersDataByCourseID(req, res, courseID);

        })
        .then((response: any) => {
            
            chapterData.push(response.data[0]);
            chapterID = response.data[0].id;
            
            // 3. Get Sections by Chapter ID
            return getSectionsDataByChapterID(req, res, chapterID);

        })
        .then((response: any) => {
           
            sectionData.push(response.data);

            sectionData.forEach((s)=>{

                // 4. Get Materials by Section ID
                var sectionID = s.id;
                console.log("Material Data - ", sectionID);
                
                

            });

            return materialData;
            
        })
        .then((response: any) => {

            // materialData.push(response.data[0]);

            // 5. Restitch Data
            return restitchCourseData(
                req, 
                res,
                courseData,
                chapterData,
                sectionData,
                materialData
            );

        })
        .then((response: any) => {

            return res.status(200).json({
                status: 200,
                message: '[Success] Comprehensive Course Data retrieved',
                data: response
            });
        });
    
    // Select Sections By Each Section ID

    // Restitch Data

}

// ===============================================================================
// (2) GET COURSE BY Course ID (Overview course data without chapters data and sections data)
// ===============================================================================
export const getOverviewCourseDataByCourseID = (req: Request, res: Response, next: NextFunction) => {

    // const dummyData: any = {...req.body};
    const courseID: string = req.body.data.courseID;

    
    const query = new PQ({
        text: `SELECT * FROM public.\"courses\" WHERE id = $1`
    });

    if(!req.body){

        return res.status(400).json({
            status: 400,
            error: '[Error] Empty request body'
        })

    };

    query.values = [
        // dummyData.id
        courseID
    ];

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getCourseByCourseID] Response: ", response);

            return {
                dbStatus: 200,
                message: '[Success] Courses by Course ID retrieved',
                data: response
            };


        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return             {
                dbStatus: 400,
                message: `[Failure] Courses by Course ID retrieved ${error}`,
            };
        
        });

};

// ===============================================================================
// GET CHAPTER BY Course ID (Overview course data without chapters data and sections data)
// ===============================================================================
export const getChaptersDataByCourseID = (req: Request, res: Response, courseID: string) => {

    // const dummyData: any = {...req.body};
    // const courseID: string = req.body.data.courseID;
    

    console.log(courseID);
    
    const query = new PQ({
        text: `SELECT * FROM public.\"chapters\" WHERE course_id = $1`
    });

    if(!req.body){

        return res.status(400).json({
            status: 400,
            error: '[Error] Empty request body'
        })

    };

    query.values = [
        // dummyData.id
        courseID
    ];

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getChapterDataDataByCourseID] Response: ", response);

            return {
                dbStatus: 200,
                message: '[Success] Chapters by Course ID retrieved',
                data: response
            };
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return {
                dbStatus: 400,
                message: `[Failure] Chapters by Course ID retrieved ${error}`,
            };
        
        });

};

// ===============================================================================
// GET SECTIONS BY Course ID (Overview course data without chapters data and sections data)
// ===============================================================================
export const getSectionsDataByChapterID = (req: Request, res: Response, chapterID: string) => {

    console.log(chapterID);
    
    const query = new PQ({
        text: `SELECT * FROM public.\"sections\" WHERE chapter_id = $1`
    });

    if(!req.body){

        return res.status(400).json({
            status: 400,
            error: '[Error] Empty request body'
        })

    };

    query.values = [
        // dummyData.id
        chapterID
    ];

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getSectionsDataDataByChapterID] Response: ", response);

            return {
                dbStatus: 200,
                message: '[Success] Sections by Chapter ID retrieved',
                data: response
            };
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return {
                dbStatus: 400,
                message: `[Failure] Sections by Course ID retrieved: ${error}`
            };
        
        });

};

// ===============================================================================
// GET MATERIALS BY Course ID (Overview course data without chapters data and sections data)
// ===============================================================================
export const getMaterialsDataBySectionID = (req: Request, res: Response, sectionID: string) => {

    console.log(sectionID);
    
    const query = new PQ({
        text: `SELECT * FROM public.\"materials\" WHERE section_id = $1`
    });

    if(!req.body){

        return res.status(400).json({
            status: 400,
            error: '[Error] Empty request body'
        });

    };

    query.values = [
        // dummyData.id
        sectionID
    ];

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getMaterialsDataByChapterID] Response: ", response);

            return {
                dbStatus: 200,
                message: '[Success] Materials by Section ID retrieved',
                data: response
            };
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return {
                dbStatus: 400,
                message: `[Failure] Materials by Section ID retrieved: ${error}`
            };
        
        });

};

export const restitchCourseData = (
    req: Request, 
    res: Response,
    courseData: any,
    chapterData: any,
    sectionData: any,
    materialData: any
) => {     

    // =============================================
    // STOP HERE 24/03/2025
    // If I am revisiting this code back, READ THIS
    // =============================================
    // 
    // We need to stitch the course data with the chapter data, section data and material data
    // This is done by iterating through the course data and adding the chapter data, section data and material data
    // to the course data. Same thing for sections to chapters
    // This build is only developed for the backend testbed. 
    // 
    // UPDATE 26/03
    // I have now implemented the stitching method.
    // But, the section data is missing at some point of the stitching process
    // If I revisit this code back, USE BREAKPOINTS AND DEBUG WHERE IT DISAPPEARED
    // ==============================================

    // Instantiate arrays

    var courseChapters: Chapter[] = [];
    var courseSections: Section[] = [];
    var courseMaterials: SectionMultimedia[] = [];
    
    console.log("")
    
    // If section has materials
    if("id" in materialData){
        
        // Push multimedia data into array
        materialData.forEach((material: any, index: number) => {
            
            courseMaterials.push({
                chapterNumber: chapterData[index].chapter_number,
                file: `${material.id}-${material.file_path}.${material.file_type}`,
                sectionNumber: sectionData[index].section_number
            });
        
        });

    }else{


    }

    // Push section data into array
    sectionData.forEach((section: any, index: number) => {
    
        courseSections.push({
            sectionNumber: section.section_number,
            sectionTitle: section.name,
            sectionDescription: section.section_description,
            sectionOutcome: section.section_outcome,
            sectionMultimedia: courseMaterials[index]
        });
    
    });

    // Push chapter data into array
    chapterData.forEach((chapter: any, index: number) => {
    
        courseChapters.push({
            chapterNumber: chapter.chapter_number,
            chapterTitle: chapter.name,
            section: courseSections
        });
    
    });

    // Bring it all together
    var comprehensiveCourseData: ComprehensiveCourseData = {
 
        courseChapters: courseChapters,
        courseTitle: courseData.name,
        courseDescription: courseData.description,
        learningObjectives: '', // [!!] Not yet implemented in DB
        topic: courseData.topic

    };

    console.log('')

    return comprehensiveCourseData;

};

export const getAllCourse_SuperUser = (req: Request, res: Response, next: NextFunction) => {
    
    const query = new PQ({
        text: `SELECT * FROM public.\"courses\"`}
    );

    return postgresDB.any(query)
        .then((response: any)=>{
            
            console.log("Response: ", response);

            return response;

        })
        .then((rawData: any) => {

            var retrievedCourseList: Course[] = [];
            
            rawData.forEach((d:any)=>{
                
                 

                var course: Course = {
                    id: d?.id,
                    name: d?.name,
                    description: d?.description,
                    topic: d?.topic,
                    image: d.cover_image_path,
                    duration: d?.duration 
                }
                
                retrievedCourseList.push(course);

            });

            return res.status(200).json({
                status: 200,
                message: '[Success] Courses retrieved',
                data: retrievedCourseList
            })


        });

}   

export const postNewCourse = async (req: Request, res: Response, next: NextFunction) => {

    // ===================
    // Parse Course Data
    // Parse Chapter Data with CourseID
    // Parse Section Data with ChapterID
    // ===================
    // const courseData = {...req.body.data};
    const courseData = JSON.parse(req.body?.courseData);
    const chapterData = {...courseData.courseChapters[0]};
    const sectionData = courseData.courseChapters[0].section;

    const courseID = uuidv4();
    const chapterID = uuidv4();
    // const sectionID = uuidv4();


    console.log('[postNewCourse] Course Data: ',courseData);
    console.log('[postNewCourse] Chapter Data: ',courseData.courseChapters[0]);
    console.log('[postNewCourse] Section Data: ',courseData.courseChapters[0].section);


    // ======================
    // Run async queries sequentially
    // ======================
    const queryChain = insertCourseIntoCourseTable(courseData, courseID, res)
        .then((response: any) => {
            
            return insertChapterIntoChapterTable(chapterData, courseID, chapterID, res);

        })
        .then((response: any) => {
            
            sectionData.forEach((section: any) => {
                
                const sectionID = uuidv4();

                // Get multimedia filename and format into separate variables
                var split1 = section?.sectionMultimedia.split('\\')[2];
                const multimediaFileName = split1.split('.')[0];
                const multimediaFormat = split1.split('.')[1];

                // Get multimediaID (created at frontend) from section data
                const multimediaID = section?.multimediaID;

                // Insert section data into section table first
                return insertSectionIntoSectionTable(section, chapterID, sectionID, res)
                    .then((response: any) => {
                        
                        // Then insert video metadata into materials table 
                        return insertMultimediaIntoMaterialsTable(sectionID,
                             multimediaID, 
                             multimediaFileName,
                             multimediaFormat, 
                             res); 
                    
                    });
            
            });

        })
        .catch((error: any) => {

            console.log("Error: ", error);

        });

    try{

        return res.status(200).json({        
            status: 200,
            message: '[Success] postNewCourse',
            timestamp: getCurrentTimestamp()
        });

    }catch(error: any){ 

        return res.status(500).json({        
            status: 500,
            message: error,
            timestamp: getCurrentTimestamp()
        });

    }
        
};

export const insertCourseIntoCourseTable = (courseData: any, courseID: string, res: Response): Promise<any> =>{

    const query = new PQ({
        // text: `INSERT INTO public.\"course\" WHERE id = $1, name = $2, topic = $3`}
        text: `INSERT INTO public.\"courses\"(id,name,topic) VALUES($1,$2,$3)`}
    );

    query.values = [
        // dummyData.id
        courseID,
        courseData.courseTitle,
        courseData.topic
    ]

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getAllCoursesByUserID] Response: ", response);

            // return res.status(200).json({
            //     status: 200,
            //     message: '[Success] insertCourseIntoCourseTable',
            //     data: response
            // });

            return {
                dbStatus: 200,
                message: '[Success] insertCourseIntoCourseTable',
            };
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return { 
                dbStatus: 500,
                message: error,
                
            };
        
        });


}

export const insertChapterIntoChapterTable = (chapterData: any, courseID: string, chapterID: string, res: Response): Promise<any> =>{

    const query = new PQ({
        // text: `INSERT INTO public.\"chapter\" WHERE id = $1, title = $2, courseID = $2, chapterNumber = $3`}
        text: `INSERT INTO public.\"chapters\"(id,"name","course_id","chapter_number") VALUES($1,$2,$3,$4)`}
    );

    console.log("[insertChapterIntoChapterTable] chapterTitle: ", chapterData);
    console.log("[insertChapterIntoChapterTable] chapterTitle: ", chapterData.chapterTitle);

    query.values = [
        
        chapterID,
        chapterData.chapterTitle,
        courseID,
        chapterData.chapterNumber

    ]

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[insertChapterIntoChapterTable] Response: ", response);

            return {
                dbStatus: 200,
                message: '[Success] insertChapterIntoChapterTable',
            };
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return { 
                dbStatus: 500,
                message: error,
                
            };
        
        });


}

export const insertSectionIntoSectionTable = (sectionData: any, chapterID: string, sectionID: string, res: Response): Promise<any> =>{

    const query = new PQ({
        // text: `INSERT INTO public.\"section\" WHERE id = $1, title = $2, sectionNumber = $3, chapterID = $4`}
        text: `INSERT INTO public.\"sections\"(id,name,"section_number","chapter_id") VALUES($1,$2,$3,$4)`}
    );

    query.values = [
        // dummyData.id
        sectionID,
        sectionData.sectionTitle,
        sectionData.sectionNumber,
        chapterID
    ]

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[insertSectionIntoSectionTable] Response: ", response);

            // return res.status(200).json({
            //     status: 200,
            //     message: '[Success] insertSectionIntoSectionTable',
            //     data: response
            // });

            return {
                dbStatus: 200,
                message: '[Success] insertSectionIntoSectionTable',
            }
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return { 
                dbStatus: 500,
                message: error,
                
            };
        
        });


}

export const insertMultimediaIntoMaterialsTable = (sectionID: string, multimediaID: string, multimediaFileName: string, multimediaFormat: string, res: Response): Promise<any> =>{

    const query = new PQ({
        // text: `INSERT INTO public.\"section\" WHERE id = $1, title = $2, sectionNumber = $3, chapterID = $4`}
        text: `INSERT INTO public.\"materials\"(id,section_id,"file_path","file_type") VALUES($1,$2,$3,$4)`}
    );

    // multimediaID = path.base('/src/course-multimedia')

    query.values = [
        // dummyData.id
        multimediaID,
        sectionID,
        multimediaFileName,
        multimediaFormat
    ]

    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[insertMultimediaIntoMaterialsTable] Response: ", response);

            return {
                dbStatus: 200,
                message: '[Success] insertMultimediaIntoMaterialsTable',
            }
        
        })
        .catch((error: any) => {

            console.log("Error: ", error);

            return { 
                dbStatus: 500,
                message: error,
            };
        
        });


}