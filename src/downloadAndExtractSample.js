import { Stream } from 'node:stream';
import got from 'got';
import { promisify } from 'node:util';
import tar from 'tar';

const pipeline = promisify(Stream.pipeline);

const baseUrl = 'https://codeload.github.com';
const branch = 'main';

export default function downloadAndExtractSample(samplesRepoOrg, samplesRepoName, sample, projectDirectory) {
  const samplesRepo = `${samplesRepoOrg}/${samplesRepoName}`;
  const archiveUrl = `${baseUrl}/${samplesRepo}/tar.gz/${branch}`;
  const archivePath = `${samplesRepoName}-${branch}/${sample}`;
  
  return pipeline(
    got.stream(archiveUrl),
    tar.extract({ cwd: projectDirectory, strip: 2 }, [archivePath])
  );
}