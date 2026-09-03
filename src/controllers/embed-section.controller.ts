import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import {
  createEmbedSection, updateEmbedSection, getPublicEmbedSection, deleteEmbedSection, getEmbedSection, listEmbedSections
} from "../services/embed-section.service";
import { previewEmbedWall } from "../services/embed-page.service";
import { renderEmbedWall } from "../views/embed-wall.view";

export const createEmbedSectionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as { id: string })?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const {
      title,
      displayStyle,
      testimonialIds,
      captionsEnabled,
      theme,
    } = req.body;

    const embedSection = await createEmbedSection(
      userId,
      {
        title,
        displayStyle,
        testimonialIds,
        captionsEnabled,
        theme,
      },
    );

    res.status(201).json(
      new ApiResponse(
        201,
        embedSection,
        "Embed section created successfully",
      ),
    );
  },
);

export const previewEmbedSectionController = asyncHandler(async (req, res) => {
  const userId = (req.user as { id: string })?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const data = await previewEmbedWall(userId, {
    title: req.body.title,
    layout: req.body.displayStyle,
    theme: req.body.theme ?? "minimal",
    captionsEnabled: req.body.captionsEnabled,
    testimonialIds: req.body.testimonialIds,
  });

  const html = renderEmbedWall(data);
  res.status(200).json(new ApiResponse(200, { html }, "Embed preview rendered"));
});

export const getPublicEmbedSectionController = asyncHandler(  async (req, res) => {
    const { publicId } = req.params;

     if (!publicId || typeof publicId !== 'string') {
      throw new ApiError(400, "Valid public embed ID is required");
    }

    const embedSection = await getPublicEmbedSection(publicId);

    res.status(200).json(
      new ApiResponse(
        200,
        embedSection,
        "Embed section retrieved successfully",
      ),
    );
  },
);

export const updateEmbedSectionController = asyncHandler(
  async (req, res) => {
    const userId = (req.user as { id: string })?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const { id } = req.params;
    

     if (!id || typeof id !== 'string') {
      throw new ApiError(400, "Valid embed section ID is required");
    }


    const updatedSection = await updateEmbedSection(
      userId,
      id,
      req.body,
    );

    res.status(200).json(
      new ApiResponse(
        200,
        updatedSection,
        "Embed section updated successfully",
      ),
    );
  },
);

export const deleteEmbedSectionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as { id: string })?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      throw new ApiError(400, "Valid embed section ID is required");
    }

    const result = await deleteEmbedSection(userId, id);

    res.status(200).json(
      new ApiResponse(200, result, "Embed section deleted successfully")
    );
  }
);

export const getEmbedSectionController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  if (!userId || !id || Array.isArray(id)) throw new ApiError(400, "Valid embed section ID is required");

  const section = await getEmbedSection(userId, id);
  res.status(200).json(new ApiResponse(200, section, "Embed section retrieved successfully"));
});

export const listEmbedSectionsController = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const sections = await listEmbedSections(userId);
  res.status(200).json(new ApiResponse(200, sections, "Embed sections retrieved successfully"));
});
