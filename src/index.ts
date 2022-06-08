import YAML from 'yaml';

interface ObjectMeta {
  name: string;
}

interface KubernetesObject {
  kind: string;
  metadata: ObjectMeta;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

export function isKubernetesObject(
  value: KubernetesObject
): value is KubernetesObject {
  return (
    isNonEmptyString(value?.kind ?? '') &&
    isNonEmptyString(value?.metadata?.name ?? '')
  );
}

export interface ManifestGenerator {
  generate(): Array<KubernetesObject>;
}

function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null;
}

export function isManifestGenerator(
  value: ManifestGenerator
): value is ManifestGenerator {
  return isNonNullObject(value) && typeof value.generate === 'function';
}

export function run(
  generator: ManifestGenerator,
  writer?: NodeJS.WritableStream
) {
  const w = writer ?? process.stdout;
  const objects = generator.generate();
  for (const i in objects) {
    const object = objects[i];
    if (!isKubernetesObject(object)) {
      throw new Error(
        `Object ${i} from generator ${generator} is not shaped like a Kubernetes object`
      );
    }
    w.write(
      YAML.stringify(object, {
        directives: true
      })
    );
  }
}
