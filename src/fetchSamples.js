import got from 'got';

const baseUrl = 'https://api.github.com/repos';

export default async function fetchSamples(repo) {
  const response = await got(`${baseUrl}/${repo}/contents/`);

  const files = JSON.parse(response.body);
  const samples = files
    .filter(file => file.type === 'dir' && !file.name.startsWith('.') && file.name !== 'bin')
    .map(({ name }) => name);
  return samples;
}