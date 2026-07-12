import {prisma} from "../config/prisma";
import { ApiError } from "../utils/ApiError";
export const getUserById = async (id: string) => {
    //check in db
    const user = await prisma.user.findUnique({where: {id}});
    if (!user) throw new ApiError(404, "User not found");
  const { password_hash, ...safeUser } = user;
  return safeUser;
};
