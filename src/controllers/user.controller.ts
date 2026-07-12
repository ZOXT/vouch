import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { getUserById } from "../services/user.service";

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user!.id);
  res.status(200).json(new ApiResponse(200, user, "User fetched"));
});