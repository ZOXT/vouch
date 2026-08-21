import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import {
  getUserById,
  getAvatarUploadUrl,
  updateAvatar,
  changePassword,
  updateProfile,
} from "../services/user.service";

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user!.id);
  res.status(200).json(new ApiResponse(200, user, "User fetched"));
});

export const getAvatarUrl = asyncHandler(async (req, res) => {
  const { fileType } = req.body;
  const userId = (req.user as { id: string }).id;

  const result = await getAvatarUploadUrl(userId, fileType);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Avatar upload URL generated"));
});

export const confirmAvatar = asyncHandler(async (req, res) => {
  const { key } = req.body;
  const userId = (req.user as { id: string }).id;

  const result = await updateAvatar(userId, key);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Avatar updated successfully"));
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req.user as { id: string }).id;

  await changePassword(userId, currentPassword, newPassword);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Password updated successfully"));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, company_name } = req.body;
  const userId = (req.user as { id: string }).id;

  const user = await updateProfile(userId, { name, company_name });
  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});
