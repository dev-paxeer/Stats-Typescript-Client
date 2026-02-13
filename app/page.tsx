import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { parseOpenAPISpec, groupEndpointsByTag } from '@/lib/openapi-parser';
import config from '@/playground.config';
import PlaygroundClient from './PlaygroundClient';

export default function Home() {
  const specFile = path.resolve(process.cwd(), config.specPath);
  const raw = yaml.load(fs.readFileSync(specFile, 'utf8')) as Record<string, any>;
  const spec = parseOpenAPISpec(raw);
  const groups = groupEndpointsByTag(spec.endpoints, spec.tags);

  return <PlaygroundClient config={config} groups={groups} endpoints={spec.endpoints} />;
}
