import initModels from "../models/init-models.js";
import sequelize from "../models/connect.js";
import bcrypt from 'bcrypt'; // lib mã hoá password
import transporter from "../config/transporter.js";
import jwt from 'jsonwebtoken';
import { createRefToken, createToken } from "../config/jwt.js";
import crypto from 'crypto'; // lib tạo code forgot password

//tạo object model đại diện cho tất cả model của orm
const model = initModels(sequelize);

const signUp = async (req, res) => {
    try {
        //lấy input từ body req (email, full_name, password)
        let { full_name, email, pass_word } = req.body
        // kiểm tra email có tồn tại trong db hay không
        let checkUser = await model.users.findOne({
            where: {
                email
            }
        })
        //code theo hướng fail first: bắt những case lỗi trước
        //nếu user tồn tại trong db => return error
        if (checkUser) {
            return res.status(400).json({ message: "Email is wrong" })
        }
        //create new user
        // create => create
        // update => update
        // remove => destroy
        await model.users.create({
            full_name,
            email,
            pass_word: bcrypt.hashSync(pass_word, 10)
        })
        //send mail
        //B1: cấu hình email
        const mailOption = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Welcome to Our Service",
            html: `
                <h1>Welcome ${full_name} to Our Service </h1>
            `
        }

        //B2: gửi email
        transporter.sendMail(mailOption, (err, info) => {
            if (err) {
                return res.status(500).json({ message: "Send email fail" });
            }
            return res.status(201).json({ message: "create user sucessfully" })
        })
    } catch (error) {
        return res.status(500).json({ message: "error API sign up" })
    }
}
const login = async (req, res) => {
    try {
        //lấy email và pass_word từ body req
        let { email, pass_word } = req.body;

        //kiểm tra email có tồn tại trong db hay không
        //nếu không có email => return error
        let checkUser = await model.users.findOne(({
            where: { email }
        }));
        if (!checkUser) {
            return res.status(400).json({ message: "Email is wrong" })
        }

        //nếu tồn tại => check password
        // param 1: password chưa mã hoá
        // param 2: password đã được mã hoá
        let checkPass = bcrypt.compareSync(pass_word, checkUser.pass_word);
        if (!checkPass) {
            return res.status(400).json({ message: "Password is wrong" });
        }
        //dùng lib jsonwebtoken để tạo token

        // tạo payload để lưu vào access token
        let payload = {
            userId: checkUser.user_id
        }

        //tạo access token bằng khoá đối xứng
        let accessToken = createToken(payload);
        

        let refreshToken = createRefToken(payload);

        //lưu refreshtoken vào table users
        await model.users.update({
            refresh_token: refreshToken
        }, {where: {user_id: checkUser.user_id}})

        //gán refresh token cho cookie của response
        res.cookie('refreshToken', refreshToken , {
            httpOnly: true,
            secure: false, //dùng riêng cho localhost, lên host là true
            sameSite: 'Lax', //đảm bảo cookie được gửi trong nhiều domain
            maxAge: 7 * 24 * 60 * 60 * 1000 // thời gian tồn tại là 7 ngày
        })

        return res.status(200).json({ message: "Login successfully", token: accessToken })
        // access token + refresh token
    } catch (error) {
        return res.status(500).json({ message: "error API login" });
    }
}

const loginFacebook = async (req, res) => {
    try {
        let { id, email, name } = req.body;
        //lấy info user từ db
        let checkUser = await model.users.findOne({
            where: {
                email
            }
        })
        //nếu email này không tồn tại trong db => tạo user mới và return access token
        if (!checkUser) {
            let newUser = await model.users.create({
                full_name: name,
                email,
                face_app_id: id
            });
            //send email welcome
            const mailOption = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Welcome to Our Service",
                html: `
                    <h1>Welcome ${name} to Our Service </h1>
                `
            }

            //B2: gửi email
            return transporter.sendMail(mailOption, (err, info) => {
                if (err) {
                    return res.status(500).json({ message: "Send email fail" });
                }
                //tạo access token
                let payload = {
                    userId: newUser.user_id
                }

                //tạo access token bằng khoá đối xứng
                let accessToken = createToken(payload);
                return res.status(201).json({ message: "Login sucessfully", token: accessToken })
            })
        }
        //nếu user tồn tại
        let payload = {
            userId: checkUser.user_id
        }

        //tạo access token bằng khoá đối xứng
        let accessToken = createToken(payload)

        return res.status(201).json({ message: "Login sucessfully", token: accessToken })
    } catch (error) {
        return res.status(500).json({ message: "error API login facebook" })
    }
}

const forgotPassword = async (req, res) => {
    try {
        let { email } = req.body;
        //kiểm tra email có tồn tại trong db hay không
        let checkUser = await model.users.findOne({
            where: {
                email
            }
        });
        if (!checkUser) {
            return res.status(400).json({ message: "Email is wrong" })
        }

        // tạo code
        let randomCode = crypto.randomBytes(6).toString("hex");
        //tạo biến để lưu expire code
        let expired = new Date(new Date().getTime() + 2 * 60 * 60 * 1000)// expire 2h

        //lưu code vào db
        await model.code.create({
            code: randomCode,
            expired
        })

        //send email gửi code forgot password
        const mailOption = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Code xác thực",
            html: `
                    <h1> ${randomCode}</h1>
                `
        }

        //B2: gửi email
        return transporter.sendMail(mailOption, (err, info) => {
            if (err) {
                return res.status(500).json({ message: "Send email fail" });
            }
            return res.status(201).json({ message: "Send forgot password successfully sucessfully" })
        })

    } catch (error) {
        return res.status(500).json({ message: "error API forgot password" });
    }
}

const changePass = async (req, res) => {
    try {
        let {email, code, newPass} = req.body

        //check email có tồn tại trong db hay không
        let checkEmail = await model.users.findOne({
            where:{email}
        });

        if(!checkEmail) {
            return res.status(400).json({message: "Email is wrong"});
        }
        if(!code) {
            return res.status(400).json({message: "Code is wrong"});
        }

        let checkCode = await model.code.findOne({
            where: {code}
        })

        if(!checkCode) {
            return res.status(400).json({message: "Code is wrong"});
        }

        let hashNewPass = bcrypt.hashSync(newPass, 10);
        //C1
        checkEmail.pass_word = hashNewPass;
        checkEmail.save();
        //C2: dùng function update

        //huỷ code sau khi change password
        await model.code.destroy({
            where:{code}
        });

        return res.status(200).json({message:"Change password successfully"});

    } catch (error) {
        return res.status(500).json({ message: "error API change password" });
    }
}

const extendToken = async (req,res) => {
    try{
        //lấy refresh token từ cookie của req
        let refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({message: "401"});
        }
        //check refresh token trong db
        let userRefToken = await model.users.findOne({
            where: {refresh_token: refreshToken}
        });
        if (!userRefToken || userRefToken == null){
            return res.status(401).json({message: "401"});
        }

        //create new access token
        let newAccessToken = createToken({userId: userRefToken.user_id});
        return res.status(200).json({message: "Success", token: newAccessToken});

    }catch(error){
        console.log("error: " ,error);
        return res.status(500).json({ message: "error API extend Token" });
    
    }
}
export {
    signUp,
    login,
    loginFacebook,
    forgotPassword,
    changePass,
    extendToken
}