import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js "
import {ApiResponse} from '../utils/ApiResponse.js'
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
const registerUser = asyncHandler (async(req,res)=>{
    const {fullname,email,password,username} = req.body
    console.log("Email:",email)

    if ([fullname,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"Fullname required")
    }
    const existedUser = await User.findOne({
        $or:[{email},{username}]
    })
    if (existedUser){
        throw new ApiError(409,"User with email and username already exist")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocal = req.files?.coverImage[0]?.path

    let coverImageLocal;
    if( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocal = req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocal)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
     
})

export {registerUser}
