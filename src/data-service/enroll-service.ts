import { Course } from "../model/Course";
import { Request, Response, NextFunction, response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { getCurrentTimestamp } from "./time-service";

const pgp = require('pg-promise')();

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

export const postCourseEnrollment = async (req: Request, res: Response, next: NextFunction) => {

    // ===================
    // Parse Enrollment Data
    // ===================
    const enrollmentData = {...req.body.data};
    const users = [...enrollmentData.users];

    console.log("[postCourseEnrollment] Enrollment Data: ",enrollmentData);

    // Pack all queries into an array of promises
    const promises = users.map((user: any) => {

        const query = new PQ({
            // text: `INSERT INTO public.\"enrollment\"(userid,courseid,completion,currentprogress) VALUES($1,$2,$3,$4)`}
            text: `INSERT INTO public.\"enrollments\"(userid,courseid) VALUES($1,$2)`}
        );
    
        query.values = [
            // dummyData.id
            user.id,
            enrollmentData.course,

        ]

        return postgresDB.any(query)
            .then((response: any) => {
                
                console.log("[postCourseEnrollment] Response: ", response);

                // return res.status(200).json({
                //     status: 200,
                //     message: '[Success] insertCourseIntoCourseTable',
                //     data: response
                // });

                return {
                    dbStatus: 200,
                    message: '[Success] postCourseEnrollment',
                };
            
            })
            .catch((error: any) => {

                console.log("Error: ", error);

                return { 
                    dbStatus: 500,
                    message: error,
                    
                };
            
            });

    });

    try{

        // Await promises before returning response
        await Promise.all(promises);

        res.status(200).json({
            status: 200,
            message: '[Success] postCourseEnrollment',
            timestamp: getCurrentTimestamp()
        });

    }catch(e){
        
        // To add more response codes
        res.status(400).json({
            status: 400,
            message: '[Success] postCourseEnrollment',
            timestamp: getCurrentTimestamp()
        });

    }



    console.log('[postCourseEnrollment] Enrollment Data: ',enrollmentData);

    // ======================
    // Run async queries sequentially
    // ======================
    // insertCourseIntoCourseTable(courseData, courseID, res)
    //     .then((response: any) => {
            
    //         return insertChapterIntoChapterTable(chapterData, courseID, chapterID, res);

    //     })
    //     .then((response: any) => {
            
    //         sectionData.forEach((section: any) => {
                
    //             const sectionID = uuidv4();

    //             return insertSectionIntoSectionTable(section, chapterID, sectionID, res);
            
    //         });

    //     })
    //     .catch((error: any) => {

    //         console.log("Error: ", error);

    //     });


        
};