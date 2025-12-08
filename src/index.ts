#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

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
  } else if (body && typeof body === "object") {
    headers["Content-Type"] = "application/json";
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = typeof body === "string" ? body : JSON.stringify(body);
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
      "Retrieve a paginated list of all assets (images, audios, videos) created under your HeyGen account.",
    inputSchema: {
      type: "object",
      properties: {},
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
      "Retrieve a paginated list of all folders created under your HeyGen account.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "create_folder",
    description: "Create a new folder in your HeyGen account.",
    inputSchema: {
      type: "object",
      properties: {
        project_type: {
          type: "string",
          description: "Type of project folder (e.g., 'mixed')",
          default: "mixed",
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

        // In a real implementation, you would read the file from the file system
        // For now, we'll provide instructions
        return {
          content: [
            {
              type: "text",
              text: `To upload an asset, you need to:
1. Read the file at: ${file_path}
2. Send a POST request to: ${UPLOAD_BASE_URL}/asset
3. Set Content-Type header to: ${mime_type}
4. Send the raw binary data as the request body

Note: File upload requires reading binary data which is not yet implemented in this tool.
You can use the following curl command as reference:

curl -X POST "${UPLOAD_BASE_URL}/asset" \\
  -H "X-Api-Key: ${API_KEY}" \\
  -H "Content-Type: ${mime_type}" \\
  --data-binary "@${file_path}"`,
            },
          ],
        };
      }

      case "list_assets": {
        const result = await makeRequest(
          `${API_BASE_URL}/asset/list`,
          "GET"
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
        const result = await makeRequest(`${API_BASE_URL}/folders`, "GET");
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
        const { project_type = "mixed" } = args as { project_type?: string };
        const result = await makeRequest(
          `${API_BASE_URL}/folders/create`,
          "POST",
          { project_type }
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
