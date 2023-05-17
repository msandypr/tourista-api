import Users from "../models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async(req, res) => {
    try{
        const users = await Users.findAll({
            attributes: ['id', 'username', 'email']
        });
        res.json(users);
    } catch(error){
        console.log(error);
    }
};

export const Register = async(req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if(password !== confirmPassword) return res.status(400).json({msg: "Password and Confirm Password doesn't match."});
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);
    try {
        await Users.create({
            username: username, 
            email: email,
            password: hashPassword
        });
        res.json({msg: "Register Success!"})
    } catch (error) {
        console.log(error);
    }
}

export const Login = async(req, res) => {
    try {
        const user = await Users.findAll({
            where:{
                email: req.body.email
            }
        });
        const match = await bcrypt.compare(req.body.password, user[0].password);
        if(!match) return res.status(400).json({msg: "Wrong Password!"});
        const userId = user[0].id;
        const username = user[0].username;
        const email = user[0].email;
        const accessToken = jwt.sign({userId, username, email}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '20s'
        });
        const refreshToken = jwt.sign({userId, username, email}, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '1d'
        });
        await Users.update({refresh_token: refreshToken},{
            where:{
                id: userId
            }
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            // secure: true
            //Uncomment jika sudah pakai HTTPS.
        });
        res.json({ accessToken });
    } catch (error) {
        res.status(404).json({msg: "Email not Registered!"});
    }
}