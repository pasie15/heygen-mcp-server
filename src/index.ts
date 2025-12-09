#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { readFileSync } from "fs";

const API_KEY = process.env.HEYGEN_API_KEY;

if (!API_KEY) {
  console.error("Error: HEYGEN_API_KEY environment variable is required");
  process.exit(1);
}

// API endpoints
const UPLOAD_BASE_URL = "https://upload.heygen.com/v1";
const API_BASE_URL = "https://api.heygen.com/v1";

// Helper function to make API requests
async function makeRequest(
  url: string,
  method: string,
  body?: any,
  contentType?: string
): Promise<any> {
  const headers: Record<string, string> = {
    "X-Api-Key": API_KEY!,
  };

  if (contentType) {
    headers["Content-Type"] = contentType;
  } else if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    headers["Content-Type"] = "application/json";
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    // Handle different body types: Buffer (binary), string, or object (JSON)
    if (Buffer.isBuffer(body)) {
      options.body = body;
    } else if (typeof body === "string") {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} - ${JSON.stringify(data)}`
    );
  }

  return data;
}

// Define tools
const tools: Tool[] = [
  // Assets Tools
  {
    name: "upload_asset",
    description:
      "Upload a media file (image, video, or audio) to HeyGen. Provide the file path and the file will be uploaded and return an asset ID for future use.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to upload",
        },
        mime_type: {
          type: "string",
          description:
            "MIME type of the file (e.g., image/png, image/jpeg, audio/mpeg, video/mp4, video/webm)",
          enum: [
            "image/png",
            "image/jpeg",
            "audio/mpeg",
            "video/mp4",
            "video/webm",
          ],
        },
      },
      required: ["file_path", "mime_type"],
    },
  },
  {
    name: "list_assets",
    description:
      "Retrieve a paginated list of all assets (images, audios, videos) created under your HeyGen account. Supports filtering by folder, file type, and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        folder_id: {
          type: "string",
          description:
            "Unique identifier of the folder to retrieve the assets from. Can be retrieved from the List Folders endpoint.",
        },
        file_type: {
          type: "string",
          description:
            "Type of the asset to retrieve (audio, video, or image)",
          enum: ["audio", "video", "image"],
        },
        limit: {
          type: "number",
          description:
            "Maximum number of assets to return in a single response. Accepts values from 0 to 100.",
          minimum: 0,
          maximum: 100,
        },
        token: {
          type: "string",
          description:
            "Pagination token used to retrieve the next set of results. This token is returned in the response and can be included in the next request to continue listing remaining assets.",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_asset",
    description: "Delete a specific asset by its unique asset ID from HeyGen.",
    inputSchema: {
      type: "object",
      properties: {
        asset_id: {
          type: "string",
          description: "The unique ID of the asset to delete",
        },
      },
      required: ["asset_id"],
    },
  },
  // Folders Tools
  {
    name: "list_folders",
    description:
      "Retrieve a paginated list of all folders created under your HeyGen account. Supports filtering by parent folder, name search, trash status, and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "Maximum number of folders to return in a single response. Accepts values from 0 to 100.",
          minimum: 0,
          maximum: 100,
        },
        parent_id: {
          type: "string",
          description: "Filter folders by their parent folder ID.",
        },
        name_filter: {
          type: "string",
          description: "Search for folders by full or partial name.",
        },
        is_trash: {
          type: "boolean",
          description:
            "Whether to retrieve folders that are in the trash. Returns only the deleted folders if set to true.",
        },
        token: {
          type: "string",
          description:
            "Pagination token used to retrieve the next set of results. This token is returned in the response and can be included in the next request to continue listing remaining folders.",
        },
      },
      required: [],
    },
  },
  {
    name: "create_folder",
    description:
      "Create a new folder in your HeyGen account. Can create top-level folders or subfolders by specifying a parent_id.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the folder.",
        },
        project_type: {
          type: "string",
          description:
            "Type of project associated with the folder. The instant_avatar and asset project types are Enterprise-Only. Defaults to 'mixed'.",
          enum: [
            "video_translate",
            "instant_avatar",
            "video",
            "asset",
            "brand_kit",
            "mixed",
          ],
          default: "mixed",
        },
        parent_id: {
          type: "string",
          description:
            "Unique identifier of the parent folder. Leave empty to create a top-level folder, or provide an existing folder's ID to create a subfolder under it.",
        },
      },
      required: [],
    },
  },
  {
    name: "update_folder",
    description: "Update (rename) an existing folder by its folder ID.",
    inputSchema: {
      type: "object",
      properties: {
        folder_id: {
          type: "string",
          description: "The unique ID of the folder to update",
        },
        name: {
          type: "string",
          description: "The new name for the folder",
        },
      },
      required: ["folder_id", "name"],
    },
  },
  {
    name: "trash_folder",
    description:
      "Move a folder to trash (delete) by its unique folder ID. The folder can be restored later.",
    inputSchema: {
      type: "object",
      properties: {
        folder_id: {
          type: "string",
          description: "The unique ID of the folder to trash",
        },
      },
      required: ["folder_id"],
    },
  },
  {
    name: "restore_folder",
    description:
      "Restore a previously trashed folder by its unique folder ID, returning it to its original location.",
    inputSchema: {
      type: "object",
      properties: {
        folder_id: {
          type: "string",
          description: "The unique ID of the folder to restore",
        },
      },
      required: ["folder_id"],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "heygen-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler for listing tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handler for calling tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Assets operations
      case "upload_asset": {
        const { file_path, mime_type } = args as {
          file_path: string;
          mime_type: string;
        };

        // Read the file as binary data
        const fileBuffer = readFileSync(file_path);

        // Upload the file to HeyGen
        const result = await makeRequest(
          `${UPLOAD_BASE_URL}/asset`,
          "POST",
          fileBuffer,
          mime_type
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_assets": {
        const { folder_id, file_type, limit, token } = args as {
          folder_id?: string;
          file_type?: string;
          limit?: number;
          token?: string;
        };

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (folder_id) queryParams.append("folder_id", folder_id);
        if (file_type) queryParams.append("file_type", file_type);
        if (limit !== undefined) queryParams.append("limit", limit.toString());
        if (token) queryParams.append("token", token);

        const queryString = queryParams.toString();
        const url = queryString
          ? `${API_BASE_URL}/asset/list?${queryString}`
          : `${API_BASE_URL}/asset/list`;

        const result = await makeRequest(url, "GET");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_asset": {
        const { asset_id } = args as { asset_id: string };
        const result = await makeRequest(
          `${API_BASE_URL}/asset/${asset_id}/delete`,
          "POST"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      // Folders operations
      case "list_folders": {
        const { limit, parent_id, name_filter, is_trash, token } = args as {
          limit?: number;
          parent_id?: string;
          name_filter?: string;
          is_trash?: boolean;
          token?: string;
        };

        // Build query parameters
        const queryParams = new URLSearchParams();
        if (limit !== undefined) queryParams.append("limit", limit.toString());
        if (parent_id) queryParams.append("parent_id", parent_id);
        if (name_filter) queryParams.append("name_filter", name_filter);
        if (is_trash !== undefined)
          queryParams.append("is_trash", is_trash.toString());
        if (token) queryParams.append("token", token);

        const queryString = queryParams.toString();
        const url = queryString
          ? `${API_BASE_URL}/folders?${queryString}`
          : `${API_BASE_URL}/folders`;

        const result = await makeRequest(url, "GET");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_folder": {
        const { name, project_type = "mixed", parent_id } = args as {
          name?: string;
          project_type?: string;
          parent_id?: string;
        };

        // Build request body
        const body: any = {
          project_type,
        };

        if (name) body.name = name;
        if (parent_id) body.parent_id = parent_id;

        const result = await makeRequest(
          `${API_BASE_URL}/folders/create`,
          "POST",
          body
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "update_folder": {
        const { folder_id, name } = args as { folder_id: string; name: string };
        const result = await makeRequest(
          `${API_BASE_URL}/folders/${folder_id}`,
          "POST",
          { name },
          "application/json"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "trash_folder": {
        const { folder_id } = args as { folder_id: string };
        const result = await makeRequest(
          `${API_BASE_URL}/folders/${folder_id}/trash`,
          "POST"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "restore_folder": {
        const { folder_id } = args as { folder_id: string };
        const result = await makeRequest(
          `${API_BASE_URL}/folders/${folder_id}/restore`,
          "POST"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HeyGen MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
