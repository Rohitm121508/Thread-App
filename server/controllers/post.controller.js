import { User } from "../models/user.model.js";
import {Post} from '../models/post.model.js'
import {v2 as cloudinary} from 'cloudinary'
export const createPost = async(req,res)=>{
    try {
        const {postedBy,text} = req.body;
        let {img}=req.body;

        if(!postedBy || !text){
            return res.status(400).json({error:"Please fill the all fields"})
        }

        const user = await User.findById(postedBy)
        if(!user){
            return res.status(400).json({error:"User not Found"})
        }

        if(user._id.toString()!==req.user._id.toString()){
            return res.status(400).json({error:"Unauthorized"})
        }

        const maxLength=500

        if(text.length>maxLength){
            return res.status(400).json({message:`Text must be less than ${maxLength} characters`})
        }
        if(img){
            const uploadedResponse =  await cloudinary.uploader.upload(img)
            img = uploadedResponse.secure_url
        }

        const newPost=new Post({postedBy,text,img})
        await newPost.save()

        res.status(201).json(newPost)
        
    } catch (err) {
		res.status(500).json({ error: err.message });
		
	}
}

export const getPost = async(req,res)=>{
    try {
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({error:"Post Not Found"})
        }

        res.status(200).json(post)
    } catch (error) {
        res.status(500).json({error:error.message})
        
    }
}


export const deletePost = async(req,res)=>{
    try {
        const post = await Post.findById(req.params.id)
        if(!post){
            return res.status(404).json({error:"Post Not Found"})
        }

        if(post.postedBy.toString()!==req.user._id.toString()){
            return res.status(401).json({error:"Unauthorized to delete post"})
        }
        if(post.img){
            const imgId = post.img.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(imgId)
        }

        await Post.findByIdAndDelete(req.params.id)

        return res.status(200).json({message:"Post deleted Successfully"})

    } catch (error) {
        res.status(500).json({error:error.message})
    }
}

export const likeUnlikePost = async(req,res)=>{
    try {
        const{id:postId} = req.params;
        const userId =req.user._id

        const post =await Post.findById(postId)
        if(!post){
            return res.status(404).json({message:"Post Not found"})
        }
        const userLikedPost = post.likes.includes(userId);

        if(userLikedPost){
           //unlike the post
           await Post.updateOne({_id:postId},{
            $pull:{likes:userId}
           })
           res.status(200).json({ message: "Post unliked successfully" });
		} else {
			// Like post
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: "Post liked successfully" });
		}

    } catch (error) {
        res.status(500).json({error:error.message})
    }
}

export const replyToPost=async(req,res)=>{
    try {
        const{text} = req.body
        const postId = req.params.id
        const userId = req.user._id
        const userProfilePic = req.user.profilePic;
        const username = req.user.username;

        if(!text){
            return res.status(400).json({error:"Text field is required"})
        }

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({error:"Post Not found"})
        }

        const reply={userId,text,username,userProfilePic}

        post.replies.push(reply);
       const savedPost =  await post.save()

       res.status(200).json(reply)
        
    } catch (error) {
        res.status(500).json({error:error.message})
    }

}

export const getFeedPost = async(req,res)=>{
    try {
        const userID= req.user._id;
        const user = await User.findById(userID)

        if(!user){
            return res.status(404).json({message:"User not found"})
        }

        const following =user.following;

        const feedPosts = await Post.find({postedBy:{$in:following}}).sort({createdAt:-1});

        res.status(200).json(feedPosts)
        
    } catch (error) {
        res.status(500).json({error:error.message})
    }
}


export const getUserPosts =async(req,res)=>{
    const {username} =req.params
    try {
        const user = await User.findOne({username})
        if(!user){
            return res.status(404).json({error:"user not found"})
        }
        const posts = await Post.find({postedBy:user._id}).sort({createdAt:-1})
        res.status(200).json(posts)
    } catch (error) {
        res.status(500).json({error:error.message})
    }
}