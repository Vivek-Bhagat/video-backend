import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { apiResponse } from "../utils/apiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
  // res.status(200).json({
  //   message: "Successfully registered",
  // });

  const { fullName, email, username, password } = req.body;
  console.log("Email: ", email);

  // if (fullName === "") {
  //   throw new apiError(400, "Fullname is required")
  // }

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new apiError(409, "username or email already exists");
  }

  const avatarLocalpath = req.files?.avatar[0]?.path;
  const coverImagelocal = req.files?.coverImage[0]?.path;

  if (!avatarLocalpath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalpath);
  const coverImage = await uploadOnCloudinary(coverImagelocal);

  if (!avatar) {
    throw new apiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.tolowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res.status(201).json(
    new apiResponse(
      201,
      "User created successfully",
      createdUser
    ).toJSON()
  )
});

export { registerUser };

//steps for registering

// get the user details from frontend
// validattion of email - not empty
// check if the user is already registered
// check fro the images , check for the avatar
// upload the image in cloudanary
// create the user object - create the entry in databse
// remove password and refresh token from field of the response
// check for user creation
// return response
