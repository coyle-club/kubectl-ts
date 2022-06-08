import tmp from 'tmp';
import { run, isManifestGenerator } from './index';
import { createWriteStream } from 'fs';
import shellescape from 'shell-escape';
import path from 'path';
import { register } from 'ts-node';

const registerOnce = (() => {
  let registered = false;
  return () => {
    if (!registered) {
      register();
    }
    registered = true;
  };
})();

function mapOptionValues(
  args: string[],
  optionNames: string[],
  callback: (arg: string) => string
): string[] {
  let insideOption = false;
  const optionNameSet: Record<string, boolean> = optionNames.reduce(
    (state, optionName) => {
      state[optionName] = true;
      return state;
    },
    {} as Record<string, boolean>
  );
  return args.map((arg) => {
    if (arg[0] === '-') {
      insideOption = optionNameSet[arg];
      return arg;
    } else {
      return insideOption ? callback(arg) : arg;
    }
  });
}

function evaluate(filename: string): string {
  if (!filename.endsWith('.ts')) {
    return filename;
  }

  registerOnce();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require(path.join(process.cwd(), filename));

  if (isManifestGenerator(module)) {
    const tempfile = tmp.fileSync();

    const tempfileStream = createWriteStream(tempfile.name);

    try {
      run(module, tempfileStream);
    } catch (err) {
      tempfile.removeCallback();
      process.stderr.write(
        `Caught error while evaluating ${filename}: ${err}\n`
      );
      process.exit(1);
    }
    return tempfile.name;
  } else {
    process.stderr.write(`Error: ${filename} does not export generate()\n`);
    process.exit(1);
  }
}

function cli() {
  process.stdout.write(
    shellescape(
      mapOptionValues(process.argv.slice(2), ['-f', '--filename'], evaluate)
    )
  );
}

cli();
