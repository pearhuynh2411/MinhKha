import connect from "../../db.js";

import initModels from "../models/init-models.js";
import sequelize from "../models/connect.js";
import { Op } from "sequelize";
import { PrismaClient } from '@prisma/client'
import { upload } from "../config/upload.js";
import { uploadCloud } from "../config/upload.cloud.js";
//tạo object model đại diện cho tất cả model của orm
const model = initModels(sequelize);
const prisma = new PrismaClient();

const getUsers = (req, res) => {
    res.status(200).json({ message: "get-users" });
};
const createUsers = (req, res) => {
    let body = req.body;
    res.send(body);
}
const getUserDb = async (req, res) => {
    const [data] = await connect.query(`
        SELECT * from users
    `)
    res.send(data);
}
const getUserOrm = async (req, res) => {
    try {
        //SELECT * FROM users
        let data = await model.users.findAll({
            where: {
                full_name: {
                    [Op.like]: `%John%`
                }
            },
            attributes: ["user_id", "full_name", "email"],
            include: [
                {
                    model: model.video, //join với table video
                    as: 'videos',
                    required: true //join table theo kiểu inner join, default là left join
                    /* attributes: ["video_name"] */
                }
            ]
        });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: "error from ORM" })
    }
}
const getUserOrmById = async (req, res) => {
    try {
        let { id } = req.params;
        let data = await model.users.findOne({
            where: {
                user_id: id
            }
        })
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ message: "error API get user by id" })
    }
}
const createUserOrm = async (req, res) => {

    let { full_name, email } = req.body;
    /* await model.users.create({
        
        full_name,
        email
    }); */
    await prisma.users.create({
        data: {
            full_name,
            email
        }
    })
    return res.status(201).json({ message: "Create user sucessfully" })

}
const updateUser = async (req, res) => {
    let { full_name, avatar, pass_word, email } = req.body;
    //check user có tồn tại trong db hay không
    let checkUser = await prisma.users.findFirst({
        where: { email }
    })
    if (!checkUser) {
        return res.status(400).json({ message: "Email not exist" })
    }

    await prisma.users.update({
        data: {
            full_name,
            avatar,
            pass_word
        },
        where: {
            email
        }


    })
    return res.status(200).json({ message: "Update user successfully" })
}
const deleteUser = async (req, res) => {
    let { user_id } = req.params;
    //check user có tồn tại trong db hay không
    let checkUser = await prisma.users.findFirst({
        where: { user_id: Number(user_id) }
    })
    if (!checkUser) {
        return res.status(400).json({ message: "User not exist" })
    }

    await prisma.users.delete({
        where: {
            user_id: Number(user_id)
        }
    })
    // on delete cascade trong table có chứa khoá ngoại
    // video_like
    /* user_id INT, */
    /* foreign key (user_id) reference users(user_id) on delete cascade */
    return res.status(200).json({ message: "Delete user successfully" })
}
const uploadOneImg = upload.single("hinhAnh")
const uploadOneHandler = (req, res) => {
    let file = req.file;
    return res.status(200).json(file);
}

const uploadManyImg = upload.array("hinhAnhs")
const uploadHandler = (req, res) => {
    let files = req.files;
    return res.status(200).json(files);
}

const uploadSingleCloud = uploadCloud.single("hinhAnh")
const uploadSingleHandler = (req, res) => {
    let file = req.file;
    return res.status(200).json(file);
}

const uploadManyCloud = uploadCloud.array("hinhAnhs")
const uploadManyHandler = (req, res) => {
    let files = req.files;
    return res.status(200).json(files);
}

export {
    getUsers, createUsers, getUserDb, getUserOrm, getUserOrmById, createUserOrm, updateUser, deleteUser, uploadOneImg,
    uploadHandler, uploadManyImg, uploadOneHandler,
    uploadSingleCloud, uploadSingleHandler, uploadManyCloud, uploadManyHandler
}