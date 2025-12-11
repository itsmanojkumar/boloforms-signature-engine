# 🔌 Railway MCP Server Setup Guide

## What is Railway MCP Server?

The Railway MCP (Model Context Protocol) server allows you to interact with Railway directly from Cursor IDE, enabling you to:
- View Railway projects and services
- Check deployment status
- View logs
- Manage environment variables
- Deploy services

---

## Setup Instructions

### Option 1: Install Railway MCP Server via Cursor Settings

1. **Open Cursor Settings**
   - Press `Ctrl+,` (Windows) or `Cmd+,` (Mac)
   - Or: File → Preferences → Settings

2. **Navigate to MCP Settings**
   - Search for "MCP" or "Model Context Protocol"
   - Or go to: Extensions → MCP Servers

3. **Add Railway MCP Server**
   - Click "Add Server" or "+"
   - Configure with:
     ```json
     {
       "name": "railway",
       "command": "npx",
       "args": [
         "-y",
         "@railway/cli",
         "mcp"
       ]
     }
     ```

4. **Install Missing Dependencies**
   - The error showed missing `graphql` package
   - Run in terminal:
     ```bash
     npm install -g graphql
     ```
   - Or install locally in your project:
     ```bash
     npm install graphql
     ```

### Option 2: Use Railway CLI Directly

If MCP server has issues, you can use Railway CLI directly:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Link to Your Project**
   ```bash
   railway link
   ```

4. **View Status**
   ```bash
   railway status
   ```

5. **View Logs**
   ```bash
   railway logs
   ```

---

## Troubleshooting Railway MCP Server

### Error: Missing 'graphql' package

**Fix:**
```bash
npm install -g graphql
```

Or add to your project:
```bash
npm install graphql
```

### Error: Cannot connect to Railway

**Check:**
1. Railway CLI is installed: `npm list -g @railway/cli`
2. You're logged in: `railway whoami`
3. MCP server configuration is correct

### MCP Server Not Showing Resources

**Try:**
1. Restart Cursor IDE
2. Check MCP server logs in Cursor
3. Verify Railway CLI is working: `railway --version`

---

## Using Railway MCP Server

Once connected, you can:

1. **List Projects**
   - Ask: "Show me my Railway projects"
   - Or: "List Railway services"

2. **Check Deployment Status**
   - Ask: "What's the status of my Railway deployment?"
   - Or: "Show Railway logs"

3. **Manage Environment Variables**
   - Ask: "Show Railway environment variables"
   - Or: "Update Railway MONGODB_URI"

---

## Alternative: Use Railway Dashboard

If MCP server doesn't work, you can always use:
- **Railway Dashboard**: https://railway.app
- **Railway CLI**: Command-line interface
- **Railway API**: Direct API access

---

## Quick Fix for Current Error

The error showed:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'graphql'
```

**Solution:**
```bash
npm install -g graphql
```

Then restart Cursor IDE and try connecting to Railway MCP server again.

---

## Verify Connection

After setup, check if MCP server is working:
1. Open Cursor
2. Try asking: "List my Railway projects"
3. If it works, you'll see your Railway projects listed

---

**Note:** The Railway MCP server is optional. You can manage Railway through:
- Railway Dashboard (web UI)
- Railway CLI (command line)
- Direct API calls

The MCP server just makes it more convenient from within Cursor IDE.




