const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { getAuthHeaders } from "@/api/auth";

export const fetchTags = async () => {
  try {
    const response = await fetch(`${API_URL}/tags/`);
    if (!response.ok) {
      throw new Error("Failed to fetch tags");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
};

export const createTag = async (tagData) => {
  try {
    const response = await fetch(`${API_URL}/tags/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(tagData),
    });
    if (!response.ok) {
      throw new Error("Failed to create tag");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
};
