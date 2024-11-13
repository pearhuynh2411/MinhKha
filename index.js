import express from 'express';
import connect from './db.js';
import rootRoutes from './src/routes/rootRoutes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
//tạo object tổng của express
const app = express();

//thêm middleware cors để nhận request từ FE hoặc bên khác

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true // set true để BE nhận được cookie từ FE
}));

//thêm middleware để get info cookie từ request FE hoặc postman
app.use(cookieParser());

//thêm middleware để covert string về API POST và PUT
app.use(express.json());

//import rootRoutes
app.use(rootRoutes);

//define middleware để handle lỗi
//define khi có err xảy ra thì express tìm tới middleware này
//lưu ý phải truyền 4 params để express hiểu, đó là middleware handle lỗi
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        message: err.message || "Internal server"
    })
});

//viết API hello world
app.get("/hello-world", (req, res) => {
    res.send("hello world");
})

app.get("/health-check", (req, res) => {
    res.send("Server is normally")
})

// lấy thông tin data từ params, query string, headers, body
// http://localhost:8080/get-user/1
//define API get-user
/* app.get("/get-user/:id", (req,res)=>{
    //lấy id từ URL
    let {id} = req.params;
    res.send(id);
}) */
//lấy 2 biến
app.get("/get-user/:id/:hoTen", (req, res) => {
    //lấy id từ URL
    let { id, hoTen } = req.params;
    let { queryString } = req.query;
    let { token, authorization } = req.headers;
    res.send({ id, hoTen, queryString, token, authorization });
});

//lấy body từ API POST(create) và PUT(Update)
/* app.post("/create-user", (req,res)=>{
    let body = req.body;
    res.send(body);
}) */
/* app.get("/get-user-db", async (req,res) => {
    const[data] = await connect.query(`
        SELECT * from users
    `)
        res.send(data);
}) */
app.post("/create-user-db", async (req, res) => {
    const query = `
        INSERT INTO users(email,full_name) VALUES (?, ?)
    `;
    let body = req.body;
    let { email, full_name } = body;
    const [data] = await connect.execute(query, [email, full_name]);
    return res.send(data);

})

// define port cho BE
app.listen(8080, () => {
    console.log("BE starting with port 8080");
})
//npx sequelize-auto -h localhost -d node47_youtube -u root -x 123456 -p 3305 --dialect mysql -o src/models -l esm

//B1: npx prisma init
//B1.1 sửa lại info connection string
//B2: npx db pull (db first)
//B3: npx prisma generate (khởi tạo client) <==> connect trong sequelize

