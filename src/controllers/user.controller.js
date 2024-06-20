import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { apiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessJWT();
    const refreshToken = user.generateRefreshJWT();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, username, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new apiError(409, "User with email or username already exists");
  }
  //console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar || !avatar.url) {
    throw new apiError(400, "Failed to upload avatar file");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new apiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body -> data
  // username or email
  // find the user
  // check password
  //  access and refresh token
  //SEND COOKIE

  // ? get the details of the user from the body
  const { email, username, password } = req.body;

  // ? get the required details of the user from the user
  if (!email || !username) {
    throw new apiError(400, "Email or username is required");
  }

  // ? Check if the user is already exist in db or not
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user) {
    throw new apiError(404, "User not found");
  }

  // ? Check the password whic is correct or not given by the user.
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new apiError(401, "Password incorrect");
  }

  // ? generating the token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // ? sending the token to the cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
    new apiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken,
      },
      "User logged in successfully"
  )
});
export { registerUser, loginUser };
