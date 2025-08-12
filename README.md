☁️ CloudSploit by Aqua Security REFACTORED - Cloud Security Scans
=================
CloudSploit is an open-source cloud security scanner that is designed to detect misconfigurations and compliance risks in public cloud environments. This is a [refactored version of the original project by Aqua Security](https://github.com/aquasecurity/cloudsploit), redesigned to support an [agentic AI system](https://github.com/jasminetntu/multiagent-security-gcp) for improved flexibility, local development, and GCP-focused use cases.

## Key Features
- Refactored main interface (index.js->main.js) for modular, cloud function-compatible scanning.
- Scans only one GCP product at a time (e.g., Compute, IAM, Storage, etc.) instead of all plugins.
- Reduced console log noise for cleaner debugging.
- Results include only vulnerabilities (non-OK results).
- Local testing mode via mock request + response.
- Plugin-to-product mapping via new pluginNames.js file,

## Quick Start
### Clone and Install
```
$ git clone https://github.com/amanshresthaatgoogle/cloudsploit.git
$ cd cloudsploit
$ npm install
```
### Run Locally
To test locally without deploying:
```
node main.js
```
Edit the mockReq at the bottom of main.js with your test credentials and product. 

## Deploying CloudSploit to Google Cloud Functions
This deployment will allow CloudSploit to run independently in the cloud and respond to HTTP scan requests. This is necessary for compatibility with "[Strawberry ScanCake](https://github.com/jasminetntu/multiagent-security-gcp)," or the multiagent AI system that streamlines security analysis by leveraging agents & LLMs.

### Step 1: Setup GCP Environment
```
gcloud config set project [YOUR_PROJECT_ID]
```
Make sure you are authenticated with the correct account.
### Step 2: Deploy the Function
**From within the cloudsploit directory:**
```
gcloud functions deploy cloudsploitScanner \
--runtime nodejs18 \
--trigger-http \
--allow-unauthenticated \
--region=us-west1 \
--memory 1024MB \
--timeout 540s
```
**Ensure that main.js in the cloudsploit directory exports the following:**
```
exports.cloudsploitScanner = async (req, res) => {
  // cloud function handler logic
};
```
**Example Request Payload:**
```
{
  "serviceAccount": {
    "client_email": "...",
    "private_key": "...",
    "project_id": "..."
  },
  "settings": {
    "product": "compute",
    "ignore_ok": true
  }
}
```
The response will be a JSON object containing all detected vulnerabilities grouped by plugin.


## File Overview
| File | Purpose |
| ----------- | ----------- |
| main.js | Entry point for Cloud Function or local scan. Handles routing, config, filtering, and output. |
| engine.js | Main scan engine. Executes selected GCP plugins and returns vulnerabilities. |
| pluginNames.js | Maps GCP products to their relevant plugins (e.g., Compute, IAM, SQL). |

## How It Works
### Architecture Overview
This refactor is designed to work as a part of a larger [AI agentic system](https://github.com/jasminetntu/multiagent-security-gcp) where agents communicate to initiate and interpret scans.
- Agents call main.js with a specific product (e.g., compute, IAM, storage)
- pluginNames.js maps the product to a set of relevant plugins
- engine.js executes only those plugins
- Results are returned as JSON containing only non-OK findings.

## Legacy CLI, Multi-Cloud Support, and Full Options
This refactor is scoped primarily for GCP use in agentic systems.
For full CLI options, compliance scans, AWS/Azure/OCI support, and original documentation, refer to -> [Original CloudSploit by Aqua Security](https://github.com/aquasecurity/cloudsploit)
