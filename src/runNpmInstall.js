import { spawn } from 'node:child_process';

export default function runNpmInstall(projectDirectory) {
  return new Promise((resolve, reject) => {
    const childProcess = spawn('npm', ['install'], {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: { ...process.env, ADBLOCK: '1', DISABLE_OPENCOLLECTIVE: '1' },
    });
    childProcess.on('exit', code => {
      if (code === 0) {
        return resolve();
      }
      reject(new Error(`npm install failed with code ${code}`));
    });
  });
}