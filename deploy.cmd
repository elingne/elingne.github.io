@echo off
setlocal
pushd "%~dp0"
node scripts\check-home.mjs
if errorlevel 1 goto failed
call npx.cmd wrangler@4.151.1 deploy --config "%~dp0wrangler.jsonc" --keep-vars
if errorlevel 1 goto failed
popd
pause
exit /b 0
:failed
echo Home validation or deployment failed. Deployment stopped.
popd
pause
exit /b 1
