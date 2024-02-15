import jwt from "jsonwebtoken"

const generateTokenAndSetCookie = (userId,res)=>{

    const token = jwt.sign({userId},process.env.JWT,{expiresIn:'15d'})

    res.cookie("jwt",token,{
        httpOnly:true,
        secure:true
    })

    return token
}


export default generateTokenAndSetCookie