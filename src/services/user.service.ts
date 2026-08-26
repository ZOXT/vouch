import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { generateAvatarUploadUrl, confirmAvatarUpload } from "./s3.service";
import { getAvatarUrl } from "../utils/media";
import { revokeAllRefreshTokens } from "./auth.service";

export const getUserById = async (id: string) => {
  //check in db
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "User not found");
  const { password_hash, avatar_url, ...safeUser } = user;
  return { ...safeUser, avatar_url: getAvatarUrl(avatar_url) };
};
export const getAvatarUploadUrl = async (userId: string, fileType: string) => {
  return generateAvatarUploadUrl(userId, fileType);
};

export const updateAvatar = async (userId: string, key: string) => {
  return confirmAvatarUpload(userId, key);
};


export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
   //need to check if the user is even authorized/authenticated

   const user = await prisma.user.findUnique({
    where: {id : userId}
   });
   
   if(!user) throw new ApiError(404, "User not found");
   
   const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new ApiError(400, "Current password is incorrect");

    const hashed =  await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash: hashed }
  });
  await revokeAllRefreshTokens(userId);
};


export const updateProfile = async (
  userId: string,
  data: { name?: string; company_name?: string }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data
  });

  const { password_hash, avatar_url, ...safeUser } = user;
  return { ...safeUser, avatar_url: getAvatarUrl(avatar_url) };
};
