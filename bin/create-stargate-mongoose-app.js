import { Command } from 'commander';
import chalk from 'chalk';
import dedent from 'dedent';
import downloadAndExtractSample from '../src/downloadAndExtractSample.js';
import fetchSamples from '../src/fetchSamples.js';
import fs from 'fs';
import path from 'node:path';
import prompts from 'prompts';
import runNpmInstall from '../src/runNpmInstall.js';

const currentFilePath = new URL(import.meta.url).pathname;
const { version } = JSON.parse(
  fs.readFileSync(path.join(currentFilePath, '..', '..', 'package.json'))
);

const samplesRepoOrg = 'stargate';
const samplesRepoName = 'stargate-mongoose-sample-apps';
const samplesRepo = `${samplesRepoOrg}/${samplesRepoName}`;

const program = new Command('create-stargate-mongoose-app')
  .version(version, '-v, --version', 'Print the version and exit')
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

const { listSamples, sample } = program.opts();
const projectDirectory = program.args[0];

if (listSamples) {
  const samples = await fetchSamples(samplesRepo);
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

if (!sample) {
  console.error();
  console.error('Please specify the sample to bootstrap from:');
  console.error(`  ${chalk.cyan(program.name())} ${chalk.cyan('<project-directory>')} ${chalk.green('--sample <sample-name>')}`);
  console.error();
  console.error('For example:');
  console.error(`  ${chalk.cyan(program.name())} ${chalk.cyan('my-sample-discord-bot')} ${chalk.green('--sample discord-bot')}`);
  console.error();
  console.error(`Run ${chalk.cyan(`${program.name()} --list-samples`)} to see all available samples.`);
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

await downloadAndExtractSample(
  samplesRepoOrg,
  samplesRepoName,
  sample,
  projectDirectory
);
await runNpmInstall(projectDirectory);

console.log();
console.log(`${chalk.green('Success!')} Created project ${chalk.bold(sample)} at:`);
console.log();
console.log(chalk.bold(projectDirectory + '/'));
console.log();