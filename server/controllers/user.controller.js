import {User} from '../models/user.model.js'
import {Post} from '../models/post.model.js'

import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from '../utils/helpers/generateTokenAndSetCookie.js';
import {v2 as cloudinary} from 'cloudinary'
import mongoose from 'mongoose';

export const signupUser= async(req,res)=>{
    try {
        const {name,email,username,password} = req.body;
        const user = await User.findOne({$or:[{username},{email}]})

        if(user){
            return res.status(400).json({message:"User already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new User({
            name,
            username,
            email,
            password:hashedPassword
        })

        const savedUser = await newUser.save()

        if(!savedUser){
            res.status(400).json({message:"Invalid User data"})
        }
        generateTokenAndSetCookie(savedUser._id,res)
        res.status(200).json({
            _id:savedUser._id,
            name:savedUser.name,
            email:savedUser.email,
            username:savedUser.username,
            bio:savedUser.bio,
            profilePic:savedUser.profilePic
        })
    } catch (err) {
        res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
    }
}


export const loginUser = async(req,res)=>{
    try {
        const {username,password}=req.body;
        const user =await User.findOne({username})
        const isPasswordValid = await bcrypt.compare(password,user?.password || "");

        if(  !user || !isPasswordValid){
           return res.status(400).json({message:"Invalid Username or Password"})
        }

        generateTokenAndSetCookie(user._id,res);

        res.status(200).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            username:user.username,
            bio:user.bio,
            profilePic:user.profilePic

        })
        
    }  catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in loginUser: ", error.message);
	}
}

export const logoutUser =async(req,res)=>{
    try {
        res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
        
    } catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
}

export const followUnFollowUser =async(req,res)=>{
    try {
       
        const {id} = req.params;
        const userToModify=await User.findById(id)
        const currentUser = await User.findById(req.user._id)

        if(id===req.user._id.toString()){
            return res.status(400).send({message:"You can not follow/unfollow yourself"})
        }

        if(!userToModify || !currentUser){
            return res.status(401).json({message:"User not found"})
        }

        const isFollowing = currentUser.following.includes(id)

        if(isFollowing){
            //unfollow user
            await User.findByIdAndUpdate(req.user._id,{
                $pull:{
                    following:id
                }
            })

            await User.findByIdAndUpdate(id,{
                $pull:{
                    followers:req.user._id
                }
            })
            res.status(200).json({ message: "User unfollowed successfully" });
        }else{
            //follow user

            await User.findByIdAndUpdate(req.user._id,{
                $push:{
                    following:id
                }
            })
            await User.findByIdAndUpdate(id,{
                $push:{
                    followers:req.user._id
                }
            })
            res.status(200).json({ message: "User followed successfully" });

        }
 

    }  catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in followUnFollowUser: ", err.message);
	}

}

export const updateUser = async(req,res)=>{
    const {name,email,username,password,bio} = req.body;
    let {profilePic} = req.body;
    const userId = req.user._id
    try {
        let user = await User.findById(userId)
        if(!user){
            return res.status(400).json({message:"User not found!"})
        }

        if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

        if(password){
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password,salt)
            user.password=hashedPassword
        }

        if(profilePic){

            if(user.profilePic){
                await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0])
            }
            const uploadedResponse = await cloudinary.uploader.upload(profilePic)
            profilePic = uploadedResponse.secure_url
        }

        user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

		user = await user.save();

      // Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);

        user.password=null

        res.status(200).json(user)
    } catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
}

export const getUserProfile = async(req,res)=>{
    //query is  either username or userid
    const {query} = req.params

    try {
        let user;

        if(mongoose.Types.ObjectId.isValid(query)){
            user = await User.findOne({_id:query}).select('-password').select('-updatedAt')
        }else{
             user =await User.findOne({username:query}).select('-password').select('-updatedAt')
        }
        if(!user){
            return res.status(400).json({message:"User not found"})
        }

        res.status(200).json(user)
        
    } catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getUserProfile: ", err.message);
	}
}