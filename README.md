# HeyGen MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with the HeyGen API, specifically for managing assets and folders.

## Features

This MCP server implements the following HeyGen API endpoints:

### Assets Management
- **upload_asset** - Upload media files (images, videos, audio) to HeyGen
- **list_assets** - Retrieve all assets in your account
- **delete_asset** - Delete specific assets by ID

### Folders Management
- **list_folders** - List all folders in your account
- **create_folder** - Create new folders
- **update_folder** - Rename existing folders
- **trash_folder** - Move folders to trash
- **restore_folder** - Restore trashed folders

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

You need to set your HeyGen API key as an environment variable:

```bash
export HEYGEN_API_KEY="your_api_key_here"
```

To get your API key:
1. Go to the [HeyGen App](https://app.heygen.com/)
2. Click the top left corner to access your Space
3. Select "Space Settings" from the dropdown
4. Navigate to the API tab
5. Copy your API token

### MCP Settings Configuration

Add the server to your MCP settings file (typically `claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "heygen": {
      "command": "node",
      "args": [
        "/path/to/mcp-servers/heygen/dist/index.js"
      ],
      "env": {
        "HEYGEN_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or using npx (no installation required):

```json
{
  "mcpServers": {
    "heygen": {
      "command": "npx",
      "args": ["heygen-mcp-server"],
      "env": {
        "HEYGEN_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or if installed globally (`npm install -g heygen-mcp-server`):

```json
{
  "mcpServers": {
    "heygen": {
      "command": "heygen-mcp-server",
      "env": {
        "HEYGEN_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Usage

Once configured, the HeyGen MCP server will be available to your MCP client. You can use the following tools:

### List Assets
```
Use the list_assets tool to retrieve all your media assets
```

### Delete Asset
```
Use the delete_asset tool with asset_id parameter to delete a specific asset
```

### List Folders
```
Use the list_folders tool to see all your folders
```

### Create Folder
```
Use the create_folder tool to create a new folder
Optionally specify project_type (default: "mixed")
```

### Update Folder
```
Use the update_folder tool with folder_id and name parameters to rename a folder
```

### Trash Folder
```
Use the trash_folder tool with folder_id parameter to move a folder to trash
```

### Restore Folder
```
Use the restore_folder tool with folder_id parameter to restore a trashed folder
```

### Upload Asset
```
Use the upload_asset tool with file_path and mime_type parameters
Supported MIME types:
- image/png
- image/jpeg
- audio/mpeg
- video/mp4
- video/webm

Note: File upload functionality requires binary file handling
```

## Development

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

### Run Locally
```bash
npm run dev
```

## API Documentation

For more information about the HeyGen API, visit:
- [HeyGen API Documentation](https://docs.heygen.com/reference)
- [HeyGen API Pricing](https://www.heygen.com/api-pricing)

## Security

**IMPORTANT**: Keep your API key secret and secure! Never commit it to version control or share it publicly. Anyone with access to your API key can make requests on your behalf.

If you suspect your API key has been compromised, contact HeyGen at contact@heygen.com immediately.

## Limitations

- The upload_asset tool currently provides instructions for manual upload as binary file handling is not yet fully implemented
- API rate limits depend on your HeyGen subscription tier
- Some operations may require specific HeyGen plan features

## License

MIT

## Support

For issues related to:
- **This MCP server**: Open an issue in this repository
- **HeyGen API**: Contact HeyGen support at contact@heygen.com
- **MCP Protocol**: Visit the [Model Context Protocol documentation](https://modelcontextprotocol.io/)
