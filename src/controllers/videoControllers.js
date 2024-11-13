import initModels from "../models/init-models.js";
import sequelize from "../models/connect.js";
import { Op } from "sequelize";
import {PrismaClient} from '@prisma/client';

//tạo object model đại diện cho tất cả model của orm
const model = initModels(sequelize);
const prisma = new PrismaClient();

const getVideos = async (req,res) => {

        let page = 3;
        let size = 4;
        let index = (page - 1) * size
        /* let data = await model.video.findAll({
            offset: index, // prisma: skip
            limit: size //prisma: take
        }); */
        let data = await prisma.video.findMany({
            skip: index,
            take: size
        });
        // Ví dụ: page = 2, limit:4
        //bỏ qua 4 item đầu tiên và lấy 4 item tiếp theo
        return res.status(200).json(data);
    
}
const getTypes = async (req,res) => {

        /* let data = await model.video_type.findAll(); */
        let data = await prisma.video_type.findMany({
            where:{
                type_id: 1
            },
            select: {
                type_name: true
            }
        });
        return res.status(200).json(data);

}
const getVideosTypeId = async (req,res) => {

        let {typeId} = req.params
        let data = await model.video.findAll({
            where: {
                type_id : typeId
            }
            
        })
        return res.status(200).json(data);
    
}
const getVideoById = async (req,res) => {

        let {videoId} = req.params
        /* let data = await model.video.findOne({
            where: {
                video_id: videoId

            },
            include: [
                {
                    model:model.users,
                    as: "user"
                }

            ]
        }) */
       let data = await prisma.video.findFirst({
            where: {
                video_id: Number(videoId) //or +videoId
            },
            
            include: {
                users: true
            }
        
       })
        return res.status(200).json(data);
    
}
export {
    getVideos,
    getTypes,
    getVideosTypeId,
    getVideoById
}