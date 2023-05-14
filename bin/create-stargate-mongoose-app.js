'use strict';

import { Command } from 'commander';
import { Stream } from 'node:stream';
import chalk from 'chalk';
import dedent from 'dedent';
import fs from 'fs';
import got from 'got';
import prompts from 'prompts';
import { promisify } from 'node:util';
import { spawn } from 'node:child_process';
import tar from 'tar';

const pipeline = promisify(Stream.pipeline);

const program = new Command('create-stargate-mongoose-app')
  .version('0.0.0', '-v, --version', 'Print the version and exit')
  .arguments('[project-directory]')
  .usage(`${chalk.green('[project-directory]')} [options]`)
  .option(
    '-s, --sample <name>',
    dedent`
  Which sample to bootstrap the project with. You can use the name of a sample
  from https://github.com/stargate/stargate-mongoose-sample-apps.
`
  )
  .option(
    '-l, --list-samples',
    dedent`
  Print available sample projects and exit
`
  )
  .allowUnknownOption()
  .parse(process.argv);

const samplesRepo = 'stargate/stargate-mongoose-sample-apps';
const { listSamples, sample } = program.opts();
const projectDirectory = program.args[0];

if (listSamples) {
  let response;

  try {
    response = await got('https://api.github.com/repos/stargate/stargate-mongoose-sample-apps/contents/');
  } catch (error) {
    throw new Error(`Unable to reach github.com`);
  }

  const files = JSON.parse(response.body);
  const samples = files
    .filter(file => file.type === 'dir' && !file.name.startsWith('.') && file.name !== 'bin')
    .map(({ name }) => name);
  console.log(`Available samples:\n\n${samples.join('\n')}\n`);
  process.exit(0);
}

if (!projectDirectory) {
  console.error();
  console.error('Please specify the project directory:');
  console.error(`  ${chalk.cyan(program.name())} ${chalk.green('<project-directory>')}`);
  console.error();
  console.error('For example:');
  console.error(`  ${chalk.cyan(program.name())} ${chalk.green('my-sample-app')}`);
  console.error();
  console.error(`Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`);
  process.exit(1);
}

try {
  fs.mkdirSync(projectDirectory);
} catch (err) {
  if (err.code !== 'EEXIST') {
    throw err;
  }
  const res = await prompts({
    type: 'confirm',
    name: 'shouldReplace',
    message: `Directory ${chalk.green(projectDirectory + '/')} already exists. Would you like to replace it?`,
  });

  if (!res.shouldReplace) {
    console.error('Exiting. You can re-run this command with a different project name.');
    process.exit(1);
  }

  fs.rmSync(projectDirectory, { recursive: true, force: true, maxRetries: 5 });
  fs.mkdirSync(projectDirectory);
}

const archiveUrl = `https://codeload.github.com/${samplesRepo}/tar.gz/main`;
const archivePath = `stargate-mongoose-sample-apps-main/${sample}`;

await pipeline(
  got.stream(archiveUrl),
  tar.extract({ cwd: projectDirectory, strip: 2 }, [archivePath])
);

await new Promise((resolve, reject) => {
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

console.log();
console.log(`${chalk.green('Success!')} Created project ${chalk.bold(sample)} at:`);
console.log();
console.log(chalk.bold(projectDirectory + '/'));
console.log();