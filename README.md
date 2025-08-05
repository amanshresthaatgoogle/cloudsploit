CloudSploit by Aqua Security REFACTORED - Cloud Security Scans
=================
CloudSploit is an open-source cloud security scanner that is designed to detect misconfigurations and compliance risks in public cloud environments. This is a [refactored version of the original project by Aqua Security](https://github.com/aquasecurity/cloudsploit), redesigned to support an agentic AI system for improved flexibility, local development, and GCP-focused use cases.

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
```
node main.js
```

## File Overview
| File | Purpose |
| ----------- | ----------- |
| main.js | Entry point for Cloud Function or local scan. Handles routing, config, filtering, and output. |
| engine.js | Main scan engine. Executes selected GCP plugins and returns vulnerabilities. |
| pluginNames.js | Maps GCP products to their relevant plugins (e.g., Compute, IAM, SQL). |

## How It Works
### Architecture Overview
This refactor is designed to work as a part of a larger AI agentic system where agents communicate to initiate and interpret scans.
- Agents call main.js with a specific product (e.g., compute, IAM, storage)
- pluginNames.js maps the product to a set of relevant plugins
- engine.js executes only those plugins
- Results are returned as JSON containing only non-OK findings.

## Local Development
To test locally without deploying:
```
node main.js
```
Edit the mockReq at the bottom of main.js with your test credentials and product. 

## Legacy CLI, Multi-Cloud Support, and Full Options
This refactor is scoped primarily for GCP use in agentic systems.
For full CLI options, compliance scans, AWS/Azure/OCI support, and original documentation, refer to -> [Original CloudSploit by Aqua Security](https://github.com/aquasecurity/cloudsploit)
