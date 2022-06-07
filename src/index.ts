import YAML from 'yaml';
import { Model } from '@kubernetes-models/base';

export interface ManifestGenerator {
  generate(): Array<Model<any>>;
}

export function isManifestGenerator(
  value: ManifestGenerator
): value is ManifestGenerator {
  return typeof value.generate === 'function';
}

export function run(
  generator: ManifestGenerator,
  writer?: NodeJS.WritableStream
) {
  const w = writer ?? process.stdout;
  generator
    .generate()
    .map((manifest) => w.write(YAML.stringify(manifest, { directives: true })));
}
