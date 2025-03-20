// import { DummyData } from "../models/DummyData";
import { Course } from "../model/Course";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentTimestamp } from "./time-service";
import multer from "multer";
import { FileMetaData } from "../model/FileMetaData";

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
    const db = pgp('postgres://postgres:password@localhost:5432/LMS-249-Prototype-DB');
    
    
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
// GET COURSE BY Course ID
// ===============================================================================
export const getCourseByCourseID = (req: Request, res: Response, next: NextFunction) => {

    // const dummyData: any = {...req.body};
    const courseID: string = req.body.data.courseID;

    console.log(courseID);
    
    const query = new PQ({
        text: `SELECT * FROM public.\"course\" WHERE id = $1`
    });

    if(!req.body){

        return res.status(400).json({
            status: 400,
            error: '[Error] Empty request body'
        })

    }

    query.values = [
        // dummyData.id
        courseID
    ]



    return postgresDB.any(query)
        .then((response: any) => {
            
            console.log("[getCourseByCourseID] Response: ", response);

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

export const getAllCourse_SuperUser = (req: Request, res: Response, next: NextFunction) => {
    
    const query = new PQ({
        text: `SELECT * FROM public.\"courses\"`}
    );

    return postgresDB.any(query)
        .then((response: any)=>{
            
            console.log("Response: ", response);

            return response;
            // return res.status(200).json({
            //     status: 200,
            //     message: '[Success] Courses retrieved',
            //     data: response
            // });

        })
        .then((data: any) => {

            return res.status(200).json({
                status: 200,
                message: '[Success] Courses retrieved',
                data: data
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