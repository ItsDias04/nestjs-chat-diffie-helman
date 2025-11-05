# Scripts

This folder contains helper scripts to simplify local development.

start-all.ps1
- Opens two new PowerShell windows and starts:
  - API: `npm run start:dev` in `ChatDiffieHelman.Api`
  - WebClient: `npm start` in `ChatDiffieHelman.WebClient`

Usage
- From the repository root run (PowerShell):

  .\scripts\start-all.ps1

Note: You might need to change PowerShell execution policy or run as administrator the first time
you run a script. Alternatively, run the commands manually in separate terminals.
